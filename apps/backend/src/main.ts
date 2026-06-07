import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { AppModule } from './app.module'

async function bootstrap() {
  // Security check: JWT_SECRET must be set and not the default
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-a-strong-random-secret' || process.env.JWT_SECRET.length < 20) {
    console.error('')
    console.error('  ⛔  SECURITY ERROR: JWT_SECRET is not properly configured.')
    console.error('  ')
    console.error('     Please set a strong JWT_SECRET in apps/backend/.env:')
    console.error('     JWT_SECRET=$(openssl rand -base64 32)')
    console.error('')
    process.exit(1)
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Security headers
  app.use(helmet())

  // Auto-create public directories
  const publicDir = join(__dirname, '..', 'public')
  ;['', 'uploads', 'uploads/avatar'].forEach((dir) => {
    const p = join(publicDir, dir)
    if (!existsSync(p)) mkdirSync(p, { recursive: true })
  })

  // Static files for uploads
  app.useStaticAssets(publicDir, { prefix: '/files/' })

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(s => s !== '*')
    : ['http://localhost:3000', 'http://localhost:3001']
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const config = new DocumentBuilder()
    .setTitle('homepage API')
    .setDescription('homepage 前后端管理系统 API 文档')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  // 根路径重定向到 Swagger 文档
  const httpAdapter = app.getHttpAdapter()
  httpAdapter.get('/', (req: any, res: any) => {
    res.redirect('/api/docs')
  })

  await app.listen(8000)
  console.log(`Server is running on http://localhost:8000`)
  console.log(`API docs at http://localhost:8000/api/docs`)
}
bootstrap()
