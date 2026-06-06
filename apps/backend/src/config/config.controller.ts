import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res, Request } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { SiteConfigService } from './config.service'
import { CreateConfigDto } from './dto/create-config.dto'
import { UpdateConfigDto } from './dto/update-config.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

interface AuthenticatedRequest {
  user: { sub: number; username: string; role: string }
}

@ApiTags('Site Config')
@Controller('config')
export class SiteConfigController {
  constructor(private configService: SiteConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取所有配置（公开）' })
  async findAll() {
    return { data: await this.configService.findAll() }
  }

  @Get('grouped')
  @ApiOperation({ summary: '获取按分类分组的配置（公开）' })
  async findGrouped() {
    return { data: await this.configService.findAllGrouped() }
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取配置（公开）' })
  async findByCategory(@Param('category') category: string) {
    return { data: await this.configService.findByCategory(category) }
  }

  @Get('export/json')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '导出配置为 JSON 文件（需登录）' })
  async exportJson(@Res() res: Response) {
    const configs = await this.configService.findAll()
    const json = JSON.stringify(configs, null, 2)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename="Dageling003-Homepage-config.json"')
    res.send(json)
  }

  @Get(':key')
  @ApiOperation({ summary: '按 key 获取配置（公开）' })
  async findByKey(@Param('key') key: string) {
    return { data: await this.configService.findByKey(key) }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增配置（需登录）' })
  async create(@Body() dto: CreateConfigDto, @Request() req: AuthenticatedRequest) {
    return { data: await this.configService.create(dto, req.user.username) }
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新配置（需登录）' })
  async update(@Param('key') key: string, @Body() dto: UpdateConfigDto, @Request() req: AuthenticatedRequest) {
    return { data: await this.configService.update(key, dto, req.user.username) }
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除配置（需登录）' })
  async delete(@Param('key') key: string, @Request() req: AuthenticatedRequest) {
    await this.configService.delete(key, req.user.username)
    return { message: `配置 '${key}' 已删除` }
  }
}
