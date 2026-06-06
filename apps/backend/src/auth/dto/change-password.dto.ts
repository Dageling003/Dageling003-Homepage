import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码', example: 'your-current-password' })
  @IsString()
  oldPassword: string

  @ApiProperty({ description: '新密码', minLength: 6, example: 'newpass123' })
  @IsString()
  @MinLength(6)
  newPassword: string
}
