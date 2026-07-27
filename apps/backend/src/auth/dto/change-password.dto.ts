import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码', example: 'your-current-password' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: '新密码（至少 8 位）',
    minLength: 8,
    example: 'new-password',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
