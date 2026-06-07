import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码', example: 'your-current-password' })
  @IsString()
  oldPassword: string

  @ApiProperty({ description: '新密码（至少 12 位）', minLength: 12, example: 'new-strong-password-12-chars' })
  @IsString()
  @MinLength(12)
  newPassword: string
}
