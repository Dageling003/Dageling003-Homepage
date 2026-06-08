import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { User } from '../users/user.entity'
import { LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { PasswordResetToken } from './entities/password-reset-token.entity'
import { MailService } from '../common/mail.service'

/** 密码重置 token 有效期（毫秒） */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 小时

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private resetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ============================================================
  //  登录 / 当前用户
  // ============================================================

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username: dto.username } })
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    return user
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto)
    const payload = { sub: user.id, username: user.username, role: user.role }
    return {
      accessToken: this.jwtService.sign(payload),
      username: user.username,
    }
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')
    const { password, ...profile } = user
    return profile
  }

  async updateProfile(userId: number, data: { avatarUrl?: string }) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl
    await this.usersRepository.save(user)
    const { password, ...profile } = user
    return profile
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('用户不存在')

    const isOldValid = await bcrypt.compare(dto.oldPassword, user.password)
    if (!isOldValid) throw new BadRequestException('旧密码不正确')

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与旧密码相同')
    }

    user.password = await bcrypt.hash(dto.newPassword, 12)
    await this.usersRepository.save(user)
    return { message: '密码修改成功' }
  }

  // ============================================================
  //  找回密码 / 重置密码
  // ============================================================

  /**
   * 始终返回成功响应（不暴露用户是否存在），
   * 邮件是「最佳努力」：发不出去就降级到日志，业务层不感知。
   */
  async requestPasswordReset(username: string) {
    const user = await this.usersRepository.findOne({ where: { username } })
    if (!user) {
      // 静默：避免暴露用户名是否存在
      return { message: '如果该用户存在，重置链接已发送（请同时检查垃圾邮件）' }
    }

    const rawToken = crypto.randomBytes(32).toString('hex') // 64 字符
    const tokenHash = this.hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)

    // 作废旧 token，仅保留最新的可用
    await this.resetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: new Date() })
      .where('user_id = :userId AND used_at IS NULL', { userId: user.id })
      .execute()
    await this.resetTokenRepository.save(
      this.resetTokenRepository.create({ userId: user.id, tokenHash, expiresAt }),
    )

    const resetUrl = this.buildResetUrl(rawToken)
    // 取第一个看起来像 email 的字段作为收件人；没有就直接用 username@<domain>
    const to = (user as any).email as string | undefined
    await this.mailService.sendPasswordResetEmail(
      to || `${user.username}@${this.deriveDomain()}`,
      user.username,
      resetUrl,
      rawToken,
    )

    return {
      message: '如果该用户存在，重置链接已发送（请同时检查垃圾邮件）',
      smtpEnabled: this.mailService.isSmtpEnabled(),
      // 仅在 SMTP 未启用时返回 token 与 URL，方便前端提示用户「请到服务器日志查看」
      ...(this.mailService.isSmtpEnabled()
        ? {}
        : { devHint: '未配置 SMTP，重置链接已写入服务器日志，请联系运维或查看 `docker logs homepage-app`' }),
    }
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = this.hashToken(rawToken)
    const record = await this.resetTokenRepository.findOne({ where: { tokenHash } })
    if (!record) throw new BadRequestException('重置链接无效或已过期')
    if (record.usedAt) throw new BadRequestException('重置链接已被使用，请重新申请')
    if (record.expiresAt.getTime() < Date.now()) throw new BadRequestException('重置链接已过期，请重新申请')

    const user = await this.usersRepository.findOne({ where: { id: record.userId } })
    if (!user) throw new BadRequestException('用户不存在')

    user.password = await bcrypt.hash(newPassword, 12)
    await this.usersRepository.save(user)
    record.usedAt = new Date()
    await this.resetTokenRepository.save(record)

    return { message: '密码重置成功，请使用新密码登录' }
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex')
  }

  private buildResetUrl(rawToken: string): string {
    const base = (process.env.PUBLIC_ADMIN_URL || process.env.CORS_ORIGIN || '').trim()
    const cleanBase = base.replace(/\/+$/, '')
    const path = `/admin/reset-password?token=${encodeURIComponent(rawToken)}`
    if (!cleanBase) return path // 没有配置时给个相对路径，运维从日志能直接看到 token
    // 容错：补齐协议
    const withScheme = /^https?:\/\//.test(cleanBase) ? cleanBase : `https://${cleanBase}`
    return `${withScheme}${path}`
  }

  private deriveDomain(): string {
    const base = (process.env.PUBLIC_ADMIN_URL || process.env.CORS_ORIGIN || 'homepage.local').trim()
    try {
      const withScheme = /^https?:\/\//.test(base) ? base : `http://${base}`
      return new URL(withScheme).hostname
    } catch {
      return 'homepage.local'
    }
  }

  // ============================================================
  //  初始化 / 首次管理员
  // ============================================================

  /**
   * 系统是否已有任何用户（用于前端决定是否显示「创建管理员」入口）
   */
  async hasAnyUser(): Promise<boolean> {
    const count = await this.usersRepository.count()
    return count > 0
  }

  /**
   * 创建第一个管理员账号。仅当 users 表为空时允许调用。
   * - 如果 DEFAULT_ADMIN_PASSWORD 环境变量存在则作为兜底，失败也不会抛错
   * - 推荐：前端 /admin/setup 第一步引导用户自设密码
   */
  async ensureAdminExists() {
    const count = await this.usersRepository.count()
    if (count > 0) return // 已有用户，什么也不做

    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD
    if (defaultPassword && defaultPassword.length >= 12) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)
      await this.usersRepository.save(
        this.usersRepository.create({
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
        }),
      )
      console.log('[AuthService] Default admin user "admin" has been created from DEFAULT_ADMIN_PASSWORD. Rotate the password immediately.')
      return
    }

    // 无环境变量 / 长度不足：不自动创建。让 /admin/setup 走「创建管理员」流程。
    console.log(
      '[AuthService] No admin user exists and DEFAULT_ADMIN_PASSWORD is not set (or too short). ' +
        'The first admin must be created via /admin/setup.',
    )
  }

  /**
   * 创建首个管理员账号（公开接口，但仅当 users 表为空时可用）。
   */
  async createFirstAdmin(username: string, password: string) {
    const count = await this.usersRepository.count()
    if (count > 0) {
      throw new ConflictException('系统已存在管理员账号，请使用登录或找回密码流程')
    }
    const hashed = await bcrypt.hash(password, 12)
    const admin = this.usersRepository.create({
      username,
      password: hashed,
      role: 'admin',
    })
    await this.usersRepository.save(admin)
    return { message: '管理员账号已创建', username }
  }
}
