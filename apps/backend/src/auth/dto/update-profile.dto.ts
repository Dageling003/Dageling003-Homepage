import { IsString, IsOptional, Matches } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '头像 URL', example: '/files/uploads/avatar/avatar.webp' })
  @IsOptional()
  @IsString()
  @Matches(/^\/files\/uploads\/avatar\/[\w.-]+\.(jpg|jpeg|png|gif|webp)$/, {
    message: 'avatarUrl 必须为 /files/uploads/avatar/ 下的合法图片路径',
  })
  avatarUrl?: string
}
