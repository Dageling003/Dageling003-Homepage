import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../common/mail.service';
import { AuditService } from '../audit/audit.service';

/** 密码重置 token 有效期（毫秒）：15 分钟 */
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * bcrypt 强度：默认 10（业界推荐，登录 <100ms）。
 * 想更严：设置 BCRYPT_ROUNDS=12 或以上（会显著拖慢登录）。
 */
function bcryptRounds(): number {
  const raw = Number(process.env.BCRYPT_ROUNDS);
  if (Number.isFinite(raw) && raw >= 4 && raw <= 15) return raw;
  return 10;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

  // ============================================================
  //  登录 / 当前用户
  // ============================================================

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    return user;
  }

  async login(dto: LoginDto, context?: { ip?: string }) {
    // BUG-003 fix: 登录事件是安全审计最有价值的对象。这里同时记录成功与
    // 失败：失败只记 attemptedUsername（避免把猜到的密码带进日志），成功
    // 记 userId + username。抛错前先写审计，保证「用户名或密码错误」也进表。
    let user: User;
    try {
      user = await this.validateUser(dto);
    } catch (err) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        entity: 'user',
        entityKey: dto.username,
        detail: JSON.stringify({
          reason: err instanceof Error ? err.message : String(err),
          ip: context?.ip,
        }),
        operator: dto.username,
      });
      throw err;
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      entity: 'user',
      entityKey: String(user.id),
      detail: JSON.stringify({ username: user.username, ip: context?.ip }),
      operator: user.username,
    });

    return {
      accessToken: this.jwtService.sign(payload),
      username: user.username,
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    const { password: _, ...profile } = user;
    return profile;
  }

  async updateProfile(
    userId: number,
    data: { avatarUrl?: string; email?: string },
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.email !== undefined) {
      // 允许空字符串显式清空邮箱；否则做基本规范化（去空白 + 小写域名部分）
      const trimmed = data.email.trim();
      user.email = trimmed ? trimmed : null;
    }
    await this.usersRepository.save(user);
    const { password: _, ...profile } = user;
    return profile;
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');

    const isOldValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isOldValid) throw new BadRequestException('旧密码不正确');

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同');
    }

    user.password = await bcrypt.hash(dto.newPassword, bcryptRounds());
    user.passwordChangedAt = new Date();
    await this.usersRepository.save(user);
    // BUG-003 fix: 密码变更进入审计，便于事后追溯账号被谁改过。
    await this.auditService.log({
      action: 'PASSWORD_CHANGE',
      entity: 'user',
      entityKey: String(user.id),
      detail: JSON.stringify({ username: user.username }),
      operator: user.username,
    });
    return { message: '密码修改成功' };
  }

  // ============================================================
  //  找回密码 / 重置密码
  // ============================================================

  /**
   * 始终返回成功响应（不暴露用户是否存在），
   * 邮件是「最佳努力」：发不出去就降级到日志，业务层不感知。
   */
  async requestPasswordReset(username: string) {
    // BUG-003 fix: 密码重置申请一律入审计（不管用户是否存在）。请求日志里
    // 不写具体用户名的密码，只记录 attemptedUsername + 是否命中用户。
    const user = await this.usersRepository.findOne({ where: { username } });
    await this.auditService.log({
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'user',
      entityKey: username,
      detail: JSON.stringify({ userFound: !!user }),
      operator: username,
    });
    if (!user) {
      // 静默：避免暴露用户名是否存在
      return {
        message: '如果该用户存在，重置链接已发送（请同时检查垃圾邮件）',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex'); // 64 字符
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    // 作废旧 token，仅保留最新的可用
    await this.resetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('user_id = :userId AND used_at IS NULL', { userId: user.id })
      .execute();
    await this.resetTokenRepository.save(
      this.resetTokenRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    const resetUrl = this.buildResetUrl(rawToken);
    // BUG-002 fix: User 实体现在有 `email` 字段。之前 `'email' in user` 恒为
    // false（实体没有该列），导致 `to` 永远是 undefined、SMTP 分支永远不进入。
    // 现在从数据库读到真实邮箱后正常发送；没绑定邮箱的旧用户仍降级到日志。
    // SEC-006 保留：绝不再拼 `${username}@${domain}` 这种伪造收件人。
    const to = (user.email ?? '').trim();
    if (to) {
      await this.mailService.sendPasswordResetEmail(
        to,
        user.username,
        resetUrl,
        rawToken,
      );
    } else {
      this.mailService.logResetTokenFallback(
        user.username,
        resetUrl,
        rawToken,
        '用户未绑定邮箱',
      );
    }

    return {
      message: '如果该用户存在，重置链接已发送（请同时检查垃圾邮件）',
      smtpEnabled: this.mailService.isSmtpEnabled(),
      // 仅在 SMTP 未启用时返回 token 与 URL，方便前端提示用户「请到服务器日志查看」
      ...(this.mailService.isSmtpEnabled()
        ? {}
        : {
            devHint:
              '未配置 SMTP，重置链接已写入服务器日志，请联系运维或查看 `docker logs homepage-app`',
          }),
    };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.resetTokenRepository.findOne({
      where: { tokenHash },
    });
    if (!record) throw new BadRequestException('重置链接无效或已过期');
    if (record.usedAt)
      throw new BadRequestException('重置链接已被使用，请重新申请');
    if (record.expiresAt.getTime() < Date.now())
      throw new BadRequestException('重置链接已过期，请重新申请');

    const user = await this.usersRepository.findOne({
      where: { id: record.userId },
    });
    if (!user) throw new BadRequestException('用户不存在');

    user.password = await bcrypt.hash(newPassword, bcryptRounds());
    user.passwordChangedAt = new Date();
    await this.usersRepository.save(user);
    record.usedAt = new Date();
    await this.resetTokenRepository.save(record);

    // BUG-003 fix: 记录密码重置完成事件。detail 不写 token/密码，
    // 只保留 userId + username 便于追溯。
    await this.auditService.log({
      action: 'PASSWORD_RESET_COMPLETE',
      entity: 'user',
      entityKey: String(user.id),
      detail: JSON.stringify({ username: user.username }),
      operator: user.username,
    });

    return { message: '密码重置成功，请使用新密码登录' };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private buildResetUrl(rawToken: string): string {
    const base = (
      process.env.PUBLIC_ADMIN_URL ||
      process.env.CORS_ORIGIN ||
      ''
    ).trim();
    const cleanBase = base.replace(/\/+$/, '');
    const path = `/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
    if (!cleanBase) return path; // 没有配置时给个相对路径，运维从日志能直接看到 token
    // 容错：补齐协议
    const withScheme = /^https?:\/\//.test(cleanBase)
      ? cleanBase
      : `https://${cleanBase}`;
    return `${withScheme}${path}`;
  }

  // ============================================================
  //  初始化 / 首次管理员
  // ============================================================

  /**
   * 系统是否已有任何用户（用于前端决定是否显示「创建管理员」入口）
   */
  async hasAnyUser(): Promise<boolean> {
    const count = await this.usersRepository.count();
    return count > 0;
  }

  /**
   * 创建第一个管理员账号。仅当 users 表为空时允许调用。
   * - 如果 DEFAULT_ADMIN_PASSWORD 环境变量存在则作为兜底，失败也不会抛错
   * - 推荐：前端 /admin/setup 第一步引导用户自设密码
   */
  async ensureAdminExists() {
    const count = await this.usersRepository.count();
    if (count > 0) return; // 已有用户，什么也不做

    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    const minPwdLen = Number(process.env.MIN_PASSWORD_LENGTH || 8);
    if (defaultPassword && defaultPassword.length >= minPwdLen) {
      const hashedPassword = await bcrypt.hash(defaultPassword, bcryptRounds());
      await this.usersRepository.save(
        this.usersRepository.create({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        }),
      );
      this.logger.warn(
        'Default admin user "admin" has been created from DEFAULT_ADMIN_PASSWORD. Rotate the password immediately.',
      );
      return;
    }

    // 无环境变量 / 长度不足：不自动创建。让 /admin/setup 走「创建管理员」流程。
    this.logger.log(
      'No admin user exists and DEFAULT_ADMIN_PASSWORD is not set (or too short). ' +
        'The first admin must be created via /admin/setup.',
    );
  }

  /**
   * 创建首个管理员账号（公开接口，但仅当 users 表为空时可用）。
   */
  async createFirstAdmin(username: string, password: string) {
    const count = await this.usersRepository.count();
    if (count > 0) {
      throw new ConflictException(
        '系统已存在管理员账号，请使用登录或找回密码流程',
      );
    }
    const hashed = await bcrypt.hash(password, bcryptRounds());
    const admin = this.usersRepository.create({
      username,
      password: hashed,
      role: 'admin',
    });
    await this.usersRepository.save(admin);
    // BUG-003 fix: 首个管理员创建是一次性、高价值事件，必须入审计。
    await this.auditService.log({
      action: 'ADMIN_CREATED',
      entity: 'user',
      entityKey: String(admin.id),
      detail: JSON.stringify({ username: admin.username }),
      operator: admin.username,
    });
    return { message: '管理员账号已创建', username };
  }
}
