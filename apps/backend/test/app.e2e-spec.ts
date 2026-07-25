import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Homepage API (e2e)', () => {
  let app: INestApplication<App>;
  // 与 auth-flow.e2e-spec.ts 同思路：给本 suite 独立 sqljs 数据库，
  // 避免被本地 apps/backend/.env（DB_TYPE=mariadb）串场。
  const dbPath = join(
    tmpdir(),
    `homepage-e2e-app-${Date.now()}-${process.pid}.sqlite`,
  );

  beforeAll(async () => {
    // NODE_ENV=test 触发 app.module 里 ThrottlerModule.skipIf，避免 @Throttle 命中
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'e2e-jwt-secret-key-do-not-use-in-prod';
    process.env.DB_TYPE = 'sqljs';
    process.env.DB_SQLITE_PATH = dbPath;
    process.env.DB_SYNCHRONIZE = 'true';
    // 显式启用密码重置，让 POST /auth/forgot-password 走真实业务路径
    // （返回 200 + anti-enumeration message），而不是被 controller 挡成 404
    process.env.PASSWORD_RESET_ENABLED = 'true';
    process.env.SETUP_TOKEN = '';
    process.env.DEFAULT_ADMIN_PASSWORD = '';
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get(
      '/health',
      (_req: unknown, res: { json: (body: unknown) => void }) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      },
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (existsSync(dbPath)) {
      try {
        unlinkSync(dbPath);
      } catch {
        // 忽略清理失败
      }
    }
  });

  // ============================================================
  //  Health check
  // ============================================================
  describe('GET /health', () => {
    it('should return status ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  // ============================================================
  //  Config public endpoints
  // ============================================================
  describe('GET /api/config', () => {
    it('should return config data', () => {
      return request(app.getHttpServer())
        .get('/api/config')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('GET /api/config/initialized', () => {
    it('should return initialized status', () => {
      return request(app.getHttpServer())
        .get('/api/config/initialized')
        .expect(200)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(body).toHaveProperty('data');
          const data = body.data as Record<string, unknown>;
          expect(data).toHaveProperty('initialized');
        });
    });
  });

  describe('GET /api/auth/has-users', () => {
    it('should return hasUsers status', () => {
      return request(app.getHttpServer())
        .get('/api/auth/has-users')
        .expect(200)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(body).toHaveProperty('data');
          const data = body.data as Record<string, unknown>;
          expect(data).toHaveProperty('hasUsers');
        });
    });
  });

  // ============================================================
  //  ValidationPipe — reject non-whitelisted fields
  // ============================================================
  describe('POST /api/auth/login', () => {
    it('should reject request with non-whitelisted body fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'pass', extra: 'injected' })
        .expect(400);
    });

    it('should reject request with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ============================================================
  //  Forgot password — public endpoint
  // ============================================================
  describe('POST /api/auth/forgot-password', () => {
    it('should always return success (anti-enumeration)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: 'nonexistent-user' })
        .expect(200)
        .expect((res) => {
          const body = res.body as Record<string, unknown>;
          expect(body.message).toContain('重置链接已发送');
        });
    });
  });

  // ============================================================
  //  Protected endpoints — require JWT
  // ============================================================
  describe('Protected endpoints', () => {
    it('GET /api/auth/profile should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('GET /api/config/export/json should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/config/export/json')
        .expect(401);
    });
  });
});
