import { IsString, IsOptional, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateConfigDto {
  @ApiProperty({ description: '配置键', example: 'greeting' })
  @IsString()
  @MinLength(1)
  configKey: string

  @ApiProperty({ description: '配置值', example: 'Hello, World!' })
  @IsString()
  configValue: string

  @ApiProperty({ description: '分类', example: 'personal', required: false })
  @IsString()
  @IsOptional()
  category?: string
}
