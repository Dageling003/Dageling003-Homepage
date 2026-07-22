import { Module, OnModuleInit, Global } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from '../common/mail.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET!,
        // 缩短到 12 小时；配合 jwt.strategy 内的 passwordChangedAt 校验，
        // 改密码 / 删账号后旧 token 立即失效
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN ||
            '12h') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService, MailService],
})
export class AuthModule implements OnModuleInit {
  constructor(private authService: AuthService) {}

  async onModuleInit() {
    await this.authService.ensureAdminExists();
  }
}
