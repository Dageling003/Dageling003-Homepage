import { IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateConfigDto {
  @ApiProperty({ description: '配置键', example: 'greeting', required: false })
  @IsString()
  @IsOptional()
  configKey?: string

  @ApiProperty({ description: '配置值（可选）', example: 'Hello, New World!', required: false })
  @IsString()
  @IsOptional()
  configValue?: string

  @ApiProperty({ description: '分类（可选）', example: 'personal', required: false })
  @IsString()
  @IsOptional()
  category?: string
}
