import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import type { Response } from 'express';
import { SiteConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { sub: number; username: string; role: string };
}

@ApiTags('Site Config')
@Controller('config')
export class SiteConfigController {
  constructor(private configService: SiteConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取所有配置（公开）' })
  async findAll() {
    return { data: await this.configService.findAll() };
  }

  @Get('grouped')
  @ApiOperation({ summary: '获取按分类分组的配置（公开）' })
  async findGrouped() {
    return { data: await this.configService.findAllGrouped() };
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取配置（公开）' })
  async findByCategory(@Param('category') category: string) {
    return { data: await this.configService.findByCategory(category) };
  }

  @Get('export/json')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '导出配置为 JSON 文件（需登录）' })
  async exportJson(@Res() res: Response) {
    const configs = await this.configService.findAll();
    const json = JSON.stringify(configs, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="homepage-config.json"',
    );
    res.send(json);
  }

  @Get('initialized')
  @ApiOperation({ summary: '检查系统是否已完成初始化设置（公开）' })
  async checkInitialized() {
    const initialized = await this.configService.isInitialized();
    return { data: { initialized } };
  }

  @Get(':key')
  @ApiOperation({ summary: '按 key 获取配置（公开）' })
  async findByKey(@Param('key') key: string) {
    return { data: await this.configService.findByKey(key) };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增配置（需登录）' })
  async create(
    @Body() dto: CreateConfigDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return { data: await this.configService.create(dto, req.user.username) };
  }

  @Put(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新配置（需登录）' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateConfigDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return {
      data: await this.configService.update(key, dto, req.user.username),
    };
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除配置（需登录）' })
  async delete(
    @Param('key') key: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.configService.delete(key, req.user.username);
    return { message: `配置 '${key}' 已删除` };
  }

  @Post('upload/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '上传头像图片（需登录）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (
        _req: Express.Request,
        file: Express.Multer.File,
        cb: (error: Error | null, accept?: boolean) => void,
      ) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          cb(new BadRequestException('仅支持 jpg/png/gif/webp 格式'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请选择图片文件');

    // Magic Bytes 校验 — 识别真实文件类型，防伪造扩展名
    const type = await (
      fileTypeFromBuffer as (
        buf: Buffer,
      ) => Promise<{ mime: string } | undefined>
    )(file.buffer);
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!type || !allowedMimes.includes(type.mime)) {
      throw new BadRequestException(
        '仅支持 jpg/png/gif/webp 格式（Magic Bytes 校验失败）',
      );
    }

    // 额外验证：sharp 能正确解析文件
    let format: string | undefined;
    try {
      const meta = await sharp(file.buffer).metadata();
      format = meta.format;
    } catch {
      throw new BadRequestException('无效的图片文件');
    }
    if (!format || !['jpeg', 'png', 'gif', 'webp'].includes(format)) {
      throw new BadRequestException('仅支持 jpg/png/gif/webp 格式');
    }

    // Compress with sharp — 重新从 buffer 处理（不在磁盘写原始文件）
    const buffer = await sharp(file.buffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    // 写入磁盘（已压缩为安全的 WebP）
    const uploadPath = join(
      __dirname,
      '..',
      '..',
      'public',
      'uploads',
      'avatar',
    );
    if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    await fsPromises.writeFile(join(uploadPath, filename), buffer);
    const url = `/files/uploads/avatar/${filename}`;
    return { data: { url } };
  }
}
