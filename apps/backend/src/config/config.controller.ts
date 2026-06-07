import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Res, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger'
import { diskStorage } from 'multer'
import { join } from 'path'
import { existsSync, mkdirSync, promises as fsPromises } from 'fs'
import sharp from 'sharp'
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
    res.setHeader('Content-Disposition', 'attachment; filename="homepage-config.json"')
    res.send(json)
  }

  @Get('initialized')
  @ApiOperation({ summary: '检查系统是否已完成初始化设置（公开）' })
  async checkInitialized() {
    const initialized = await this.configService.isInitialized()
    return { data: { initialized } }
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

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传头像图片（需登录）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          const uploadPath = join(__dirname, '..', '..', 'public', 'uploads', 'avatar')
          if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true })
          cb(null, uploadPath)
        },
        filename: (_req: any, _file: any, cb: any) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
          cb(null, `avatar-${unique}.webp`)
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          cb(new BadRequestException('仅支持 jpg/png/gif/webp 格式'), false)
          return
        }
        cb(null, true)
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('请选择图片文件')
    // Compress with sharp
    const filePath = file.path
    const buffer = await sharp(filePath)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer()
    await fsPromises.writeFile(filePath, buffer)
    const url = `/files/uploads/avatar/${file.filename}`
    return { data: { url } }
  }
}
