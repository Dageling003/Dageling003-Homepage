import { IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @MinLength(2)
  username: string

  @ApiProperty({ description: '密码', example: 'your-password' })
  @IsString()
  @MinLength(6)
  password: string
}
