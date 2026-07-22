import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Headers,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
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

interface AuthenticatedRequest {
  user: { sub: number; username: string; role: string };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '管理员登录' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================================
  //  找回密码 / 重置密码（公开接口）
  // ============================================================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: '申请密码重置（公开）',
    description:
      '提交用户名，系统生成一次性 token。若配置了 SMTP 则发送邮件，否则写入服务器日志。',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.username);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: '使用重置 token 设置新密码（公开）' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
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
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
      if (!setupTokenHeader || setupTokenHeader.trim() !== expected) {
        throw new ForbiddenException(
          '缺少或错误的 SETUP_TOKEN。请在服务器 .env 中查看 SETUP_TOKEN，并在初始化页面输入。',
        );
      }
    }
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
