import {
  IsString,
  IsOptional,
  Matches,
  IsEmail,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '头像 URL',
    example: '/files/uploads/avatar/avatar.webp',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\/files\/uploads\/avatar\/[\w.-]+\.(jpg|jpeg|png|gif|webp)$/, {
    message: 'avatarUrl 必须为 /files/uploads/avatar/ 下的合法图片路径',
  })
  avatarUrl?: string;

  /**
   * 用户邮箱，用于密码重置邮件。
   * 允许显式传空字符串来清空邮箱（此时跳过 IsEmail 校验）。
   */
  @ApiPropertyOptional({
    description: '用于密码重置的邮箱地址（留空字符串可清空）',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @ValidateIf((_, v) => typeof v === 'string' && v.length > 0)
  @IsEmail({}, { message: 'email 必须是合法邮箱地址' })
  email?: string;
}
