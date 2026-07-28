import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { cpus, loadavg } from 'node:os';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  // Security check: JWT_SECRET must be set and not the default.
  // 长度阈值默认 16 位（对个人主页足够）；想更严：MIN_JWT_LENGTH=20 或 32。
  const minJwtLen = Number(process.env.MIN_JWT_LENGTH || 16);
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'replace-with-a-strong-random-secret' ||
    process.env.JWT_SECRET.length < minJwtLen
  ) {
    console.error('');
    console.error(
      '  ⛔  SECURITY ERROR: JWT_SECRET is not properly configured.',
    );
    console.error('  ');
    console.error(
      `     Please set a JWT_SECRET (>= ${minJwtLen} chars) in apps/backend/.env:`,
    );
    console.error('     JWT_SECRET=$(openssl rand -base64 32)');
    console.error('');
    process.exit(1);
  }

  // Fail-fast: DB_SYNCHRONIZE=true in production with MariaDB is a data-loss
  // footgun (TypeORM will happily drop columns to match the ORM shape).
  // sqlite 场景下 synchronize 是安全的（个人主页规模），不做拦截。
  if (
    process.env.DB_TYPE === 'mariadb' &&
    process.env.NODE_ENV === 'production' &&
    process.env.DB_SYNCHRONIZE === 'true'
  ) {
    console.error('');
    console.error(
      '  ⛔  SECURITY ERROR: DB_SYNCHRONIZE=true in production with MariaDB.',
    );
    console.error('  ');
    console.error(
      '     TypeORM schema sync will silently drop/alter columns to match',
    );
    console.error(
      '     the current entity shape and can destroy data. Use migrations:',
    );
    console.error('       DB_SYNCHRONIZE=false');
    console.error('       DB_MIGRATIONS_RUN=true');
    console.error('');
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers — 默认走 helmet 默认预设（对个人主页足够）。
  // 想开启严格模式（严格 CSP + HSTS preload + COEP）：SECURITY_HEADERS_STRICT=true
  const strictHeaders = process.env.SECURITY_HEADERS_STRICT === 'true';
  app.use(
    helmet(
      strictHeaders
        ? {
            contentSecurityPolicy:
              process.env.NODE_ENV === 'production'
                ? {
                    directives: {
                      defaultSrc: ["'self'"],
                      scriptSrc: ["'self'"],
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
          }
        : {
            // helmet 默认预设（不含 preload / COEP=true / 自定义 CSP），
            // 允许网站正常嵌 iframe / 被外链引用。
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            hsts:
              process.env.NODE_ENV === 'production'
                ? { maxAge: 15552000, includeSubDomains: false, preload: false }
                : false,
          },
    ),
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
  const isNotProd = process.env.NODE_ENV !== 'production';
  if (isNotProd) {
    const config = new DocumentBuilder()
      .setTitle('homepage API')
      .setDescription('homepage 前后端管理系统 API 文档')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Raw Express access for health endpoints (bypasses NestJS routing/GlobalPrefix)
  const expressApp = (
    app.getHttpAdapter() as unknown as {
      getInstance: () => import('express').Express;
    }
  ).getInstance();

  if (isNotProd) {
    expressApp.get('/', (_req, res) => {
      res.redirect('/api/docs');
    });
  }

  expressApp.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  expressApp.get('/health/detailed', (_req, res) => {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    const cpuInfo = cpus();
    const loads = loadavg();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      uptime_human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss_mb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heap_used_mb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heap_total_mb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        external_mb: Math.round((mem.external / 1024 / 1024) * 100) / 100,
      },
      system: {
        cpu_count: cpuInfo.length,
        load_avg_1m: Math.round(loads[0] * 100) / 100,
        load_avg_5m: Math.round(loads[1] * 100) / 100,
        load_avg_15m: Math.round(loads[2] * 100) / 100,
        node_version: process.version,
        platform: process.platform,
      },
    });
  });

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

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

void bootstrap();
