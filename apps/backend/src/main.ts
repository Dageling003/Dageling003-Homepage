import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  // Security check: JWT_SECRET must be set and not the default
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'replace-with-a-strong-random-secret' ||
    process.env.JWT_SECRET.length < 20
  ) {
    console.error('');
    console.error(
      '  ⛔  SECURITY ERROR: JWT_SECRET is not properly configured.',
    );
    console.error('  ');
    console.error('     Please set a strong JWT_SECRET in apps/backend/.env:');
    console.error('     JWT_SECRET=$(openssl rand -base64 32)');
    console.error('');
    process.exit(1);
  }

  // Warn if DB_SYNCHRONIZE is enabled in production (MariaDB only)
  if (
    process.env.DB_TYPE !== 'sqlite' &&
    process.env.NODE_ENV === 'production' &&
    process.env.DB_SYNCHRONIZE === 'true'
  ) {
    console.warn('');
    console.warn('  ⚠️  WARNING: DB_SYNCHRONIZE=true in production mode.');
    console.warn(
      '     This may cause data loss. Set DB_SYNCHRONIZE=false for production.',
    );
    console.warn('');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers — hardened for production
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                // Vite 产物是 ES modules，不注入内联脚本；样式全部走独立 CSS
                scriptSrc: ["'self'"],
                // ant-design-vue 运行时会通过 dynamic <style> 注入组件级样式，
                // 因此 style-src 允许 'unsafe-inline'；后续可用 style-src-elem +
                // hash 或 CSP nonce 收紧
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Global body size limits to prevent large payload attacks
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // NOTE: JWT-in-cookie parsing (SEC-002) is handled inside jwt.strategy.ts
  // by reading the raw `Cookie` header. No cookie-parser middleware needed.

  // Auto-create public directories
  const publicDir = join(__dirname, '..', 'public');
  ['', 'uploads', 'uploads/avatar'].forEach((dir) => {
    const p = join(publicDir, dir);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
  });

  // Static files for uploads
  app.useStaticAssets(publicDir, { prefix: '/files/' });

  const corsOriginEnv = process.env.CORS_ORIGIN;
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins: string[] = corsOriginEnv
    ? corsOriginEnv.split(',').flatMap((s) => {
        const origin = s.trim();
        if (!origin || origin === '*') return [];
        // If already a full URL (has scheme), use as-is
        if (origin.startsWith('http://') || origin.startsWith('https://'))
          return [origin];
        // Bare domain/IP: production only allows https to prevent accidental
        // http-based CORS trust. In development we still expose http for
        // local reverse proxies / test envs. (SEC-004)
        return isProd
          ? [`https://${origin}`]
          : [`http://${origin}`, `https://${origin}`];
      })
    : ['http://localhost:3000', 'http://localhost:3001'];
  app.enableCors({
    origin: allowedOrigins.length
      ? allowedOrigins
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — disabled in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('homepage API')
      .setDescription('homepage 前后端管理系统 API 文档')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Root redirect to Swagger docs (development only)
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get(
      '/',
      (_req: unknown, res: { redirect: (url: string) => void }) => {
        res.redirect('/api/docs');
      },
    );
  }

  // Health check endpoint (always available)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(
    '/health',
    (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    },
  );

  // SEC-003: in production, refuse to boot when the DB has no users AND
  // SETUP_TOKEN is missing. Without this gate any anonymous request to
  // POST /api/auth/create-first-admin during the brief window between
  // container start and the operator opening /admin/setup can hijack
  // the admin account (attacker discovers new hosts via CT logs).
  //
  // Mirrors the JWT_SECRET boot gate at the top of this file.
  if (isProd) {
    const setupToken = process.env.SETUP_TOKEN?.trim();
    if (!setupToken) {
      const authService = app.get(AuthService);
      const hasAny = await authService.hasAnyUser();
      if (!hasAny) {
        console.error('');
        console.error(
          '  ⛔  SECURITY ERROR: no admin user exists and SETUP_TOKEN is not set.',
        );
        console.error('  ');
        console.error(
          '     During the window between server start and first setup,',
        );
        console.error(
          '     anyone on the internet can call /api/auth/create-first-admin',
        );
        console.error(
          '     and hijack the admin account. Set SETUP_TOKEN in your .env:',
        );
        console.error('     SETUP_TOKEN=$(openssl rand -hex 24)');
        console.error('');
        console.error(
          '     After you finish /admin/setup, you may clear the variable.',
        );
        console.error('');
        await app.close();
        process.exit(1);
      }
    }
  }

  const port = process.env.PORT || 8000;
  await app.listen(port);
  Logger.log(`Server is running on http://localhost:${port}`, 'Bootstrap');
  if (process.env.NODE_ENV !== 'production') {
    Logger.log(`API docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}
void bootstrap();
