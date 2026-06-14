import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '从邮件链接中获取的重置 token' })
  @IsString()
  @MinLength(32)
  token: string;

  @ApiProperty({
    description: '新密码（至少 12 位）',
    minLength: 12,
    example: 'new-strong-password-12-chars',
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword: string;
}

export class CreateFirstAdminDto {
  @ApiProperty({ description: '管理员用户名', example: 'admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '用户名仅支持字母、数字、下划线、连字符',
  })
  username: string;

  @ApiProperty({ description: '密码（至少 12 位）', minLength: 12 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
}
