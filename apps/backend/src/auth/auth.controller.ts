import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import * as crypto from 'crypto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  CreateFirstAdminDto,
} from './dto/password-recovery.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const LOGIN_THROTTLE_LIMIT = Number(process.env.LOGIN_THROTTLE_LIMIT) || 5;
const LOGIN_THROTTLE_TTL = Number(process.env.LOGIN_THROTTLE_TTL) || 60000;
const loginThrottle = {
  default: { limit: LOGIN_THROTTLE_LIMIT, ttl: LOGIN_THROTTLE_TTL },
};

interface AuthenticatedRequest {
  user: { sub: number; username: string; role: string };
}

/**
 * SEC-002: JWT is issued both as a Bearer token (for CI / curl) and as
 * an HttpOnly cookie (for browser sessions). The cookie flavor cannot be
 * read from JavaScript, so an XSS payload can no longer exfiltrate the
 * session token via `localStorage.getItem('token')`.
 *
 * Cookie hardening:
 *   HttpOnly           — invisible to document.cookie / XSS
 *   Secure             — only sent over HTTPS in production
 *   SameSite=Strict    — same-origin only; blocks CSRF from other sites
 *   Path=/             — sent to the whole app (needed for /api and /admin)
 *   Max-Age            — mirrors JWT expiry
 */
const AUTH_COOKIE = 'hp_token';
const AUTH_COOKIE_MAX_AGE_SEC = 12 * 60 * 60; // 12h — matches JwtModule default
function buildCookieAttrs(maxAgeSec: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
    `Max-Age=${maxAgeSec}`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(loginThrottle)
  @ApiOperation({ summary: '管理员登录' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: ExpressRequest,
  ) {
    // BUG-003: 传 IP 给 service 层，让审计日志记录来源；X-Forwarded-For
    // 只在配置了信任代理时才可信，这里保守取直接连接方 IP 或首个 XFF。
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ||
      req.ip ||
      req.socket?.remoteAddress ||
      undefined;
    const result = await this.authService.login(dto, { ip: ip?.trim() });
    res.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE}=${encodeURIComponent(result.accessToken)}; ${buildCookieAttrs(AUTH_COOKIE_MAX_AGE_SEC)}`,
    );
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登出（清除会话 cookie）' })
  logout(@Res({ passthrough: true }) res: Response) {
    // Overwrite with an empty value and Max-Age=0 to force browser eviction.
    res.setHeader('Set-Cookie', `${AUTH_COOKIE}=; ${buildCookieAttrs(0)}`);
    return { message: '已登出' };
  }

  // ============================================================
  //  找回密码 / 重置密码（公开接口，需 PASSWORD_RESET_ENABLED=true 开启）
  // ============================================================

  private assertPasswordResetEnabled() {
    if (process.env.PASSWORD_RESET_ENABLED !== 'true') {
      throw new NotFoundException(
        '忘记密码功能未启用。请在服务器上设置 PASSWORD_RESET_ENABLED=true 后重启，' +
          '或直接使用 docker exec 手动重置管理员密码。',
      );
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(loginThrottle)
  @ApiOperation({
    summary: '申请密码重置（公开，需 PASSWORD_RESET_ENABLED=true）',
    description:
      '提交用户名，系统生成一次性 token。若配置了 SMTP 则发送邮件，否则写入服务器日志。',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.assertPasswordResetEnabled();
    return this.authService.requestPasswordReset(dto.username);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle(loginThrottle)
  @ApiOperation({
    summary:
      '使用重置 token 设置新密码（公开，需 PASSWORD_RESET_ENABLED=true）',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.assertPasswordResetEnabled();
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ============================================================
  //  系统状态 / 首次创建管理员（公开接口）
  // ============================================================

  @Get('has-users')
  @ApiOperation({
    summary: '系统是否已存在任意用户（公开）',
    description: '前端用此判断是否进入「首次设置」流程。',
  })
  async hasUsers() {
    return {
      data: {
        hasUsers: await this.authService.hasAnyUser(),
        setupTokenRequired: !!process.env.SETUP_TOKEN?.trim(),
      },
    };
  }

  @Post('create-first-admin')
  @HttpCode(HttpStatus.OK)
  @Throttle(loginThrottle)
  @ApiOperation({
    summary: '创建第一个管理员账号（仅 users 表为空时可用）',
    description:
      '首次部署时由 /admin/setup 调用。若配置了 SETUP_TOKEN 环境变量，必须通过 X-Setup-Token 请求头提供匹配的令牌。',
  })
  async createFirstAdmin(
    @Body() dto: CreateFirstAdminDto,
    @Headers('x-setup-token') setupTokenHeader?: string,
  ) {
    const expected = process.env.SETUP_TOKEN?.trim();
    if (expected) {
      // SEC-007: constant-time compare to remove any theoretical timing
      // side channel. Length-mismatch check first avoids exceptions from
      // timingSafeEqual on unequal buffers.
      const provided = setupTokenHeader?.trim() ?? '';
      const providedBuf = Buffer.from(provided, 'utf8');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const ok =
        providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf);
      if (!ok) {
        throw new ForbiddenException(
          '缺少或错误的 SETUP_TOKEN。请在服务器 .env 中查看 SETUP_TOKEN，并在初始化页面输入。',
        );
      }
    }
    // Do NOT auto-login here — the frontend still calls POST /auth/login
    // right after this, which will set the cookie. Keeping create-first-admin
    // cookie-free avoids leaking a session for the create-only flow.
    return this.authService.createFirstAdmin(dto.username, dto.password);
  }

  // ============================================================
  //  需登录的接口
  // ============================================================

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新个人资料（需登录）' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return { data: await this.authService.updateProfile(req.user.sub, dto) };
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码（需登录）' })
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, dto);
  }
}
