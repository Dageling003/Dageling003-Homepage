/**
 * e2e：登录、密码修改、忘记密码、密码重置 完整闭环。
 *
 * 覆盖策略：
 *   1. 用 sqljs 内存驱动 + fresh module（每个 describe 之间数据不串）
 *   2. 覆盖 MailService，避免真实 SMTP 调用；断言接口层是否触发发邮件
 *   3. 从 HTTP 层进入，验证 controller + guard + service + repository 的完整链路
 *
 * 与 auth.service.spec.ts 的分工：
 *   - auth.service.spec.ts 只 mock repository 断 service 行为
 *   - 本文件真正让请求走过 HTTP → guard → DTO validation → service → DB
 *   - 补上「登录后拿 cookie / bearer 拿 profile」这条前后台真实用的路径
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/common/mail.service';

const ADMIN_USERNAME = 'e2e-admin';
const ADMIN_PASSWORD = 'e2e-password-123';
const NEW_PASSWORD = 'new-e2e-password-456';

// 用来在测试内拦截 requestPasswordReset 发出的 token（生产上通过邮件送达，
// 测试环境直接从 mock 里取）
type Captured = {
  emailSent: boolean;
  rawToken: string | null;
  fallbackHits: number;
};

function makeMailMock(captured: Captured): Partial<MailService> {
  return {
    isSmtpEnabled: () => false,
    sendPasswordResetEmail: jest.fn(
      (_to: string, _username: string, _url: string, rawToken: string) => {
        captured.emailSent = true;
        captured.rawToken = rawToken;
        return Promise.resolve();
      },
    ),
    logResetTokenFallback: jest.fn(
      (_username: string, _url: string, rawToken: string) => {
        captured.fallbackHits += 1;
        captured.rawToken = rawToken;
      },
    ),
  };
}

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  const captured: Captured = {
    emailSent: false,
    rawToken: null,
    fallbackHits: 0,
  };
  // sqljs 的 autoSave 会把 :memory: 也当作路径持久化到 cwd 下，导致跨次 e2e
  // 运行数据串。这里给每次运行一个 tmpdir 里的唯一路径，afterAll 清理。
  const dbPath = join(
    tmpdir(),
    `homepage-e2e-${Date.now()}-${process.pid}.sqlite`,
  );

  beforeAll(async () => {
    // ConfigModule.forRoot() 默认只 fill 尚未定义的 env，所以 beforeAll 里
    // 显式赋空串就能"占位"、阻止 .env 里的真实值污染测试环境。
    // 覆盖策略：sqljs 内存 + 关掉 SETUP_TOKEN gate + 关掉默认 admin seed
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'e2e-jwt-secret-key-do-not-use-in-prod';
    process.env.DB_TYPE = 'sqljs';
    process.env.DB_SQLITE_PATH = dbPath;
    process.env.DB_SYNCHRONIZE = 'true';
    process.env.PASSWORD_RESET_ENABLED = 'true';
    process.env.SETUP_TOKEN = '';
    process.env.DEFAULT_ADMIN_PASSWORD = '';
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(makeMailMock(captured))
      // 关掉全局限流：登录接口 @Throttle(5/60s)，e2e 会连续打十几次 /login。
      // 全局 ThrottlerGuard 是通过 APP_GUARD 注入的，overrideGuard 拦不到，
      // 只能替换掉底层 ThrottlerGuard 类：直接放行。生产限流的正确性由
      // 单独的 throttle 测试覆盖，不在这里回归。
      .overrideProvider(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
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
  //  Step 1: 全新数据库，没有任何用户
  // ============================================================
  describe('Step 1 · fresh DB', () => {
    it('GET /api/auth/has-users → hasUsers=false', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/has-users')
        .expect(200);
      const body = res.body as {
        data: { hasUsers: boolean; setupTokenRequired: boolean };
      };
      expect(body.data.hasUsers).toBe(false);
      expect(body.data.setupTokenRequired).toBe(false);
    });

    it('POST /api/auth/login (no user) → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
        .expect(401);
    });

    it('GET /api/auth/profile (no token) → 401', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });
  });

  // ============================================================
  //  Step 2: 创建首位管理员（SETUP_TOKEN 未启用，任何人可调）
  // ============================================================
  describe('Step 2 · create-first-admin', () => {
    it('POST /api/auth/create-first-admin → 200', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/create-first-admin')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
        .expect(200);
    });

    it('GET /api/auth/has-users → hasUsers=true', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/has-users')
        .expect(200);
      const body = res.body as { data: { hasUsers: boolean } };
      expect(body.data.hasUsers).toBe(true);
    });

    it('POST /api/auth/create-first-admin (第二次) → 应该被 service 拒绝', async () => {
      // 第一位创建后应该返回业务错误（4xx），不允许再无授权创建
      const res = await request(app.getHttpServer())
        .post('/api/auth/create-first-admin')
        .send({ username: 'another', password: 'another-password-8+' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  // ============================================================
  //  Step 3: 登录 + Cookie / Bearer 双通道
  // ============================================================
  let bearerToken = '';
  let cookieHeader = '';

  describe('Step 3 · login', () => {
    it('POST /api/auth/login → 200 & accessToken + Set-Cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
        .expect(200);
      const body = res.body as { accessToken: string };
      expect(typeof body.accessToken).toBe('string');
      expect(body.accessToken.length).toBeGreaterThan(20);
      bearerToken = body.accessToken;

      const setCookie = res.headers['set-cookie'] as string[] | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : [];
      const authCookie = cookies.find((c) => c.startsWith('hp_token='));
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/);
      expect(authCookie).toMatch(/SameSite=Strict/);
      cookieHeader = (authCookie as string).split(';')[0]; // 'hp_token=xxxxx'
    });

    it('POST /api/auth/login (wrong password) → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: 'wrong-password-1' })
        .expect(401);
    });

    it('POST /api/auth/login (short password) → 400 by DTO', async () => {
      // login.dto MinLength(8)
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: 'short' });
      expect(res.status).toBe(400);
    });

    it('GET /api/auth/profile with Bearer → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${bearerToken}`)
        .expect(200);
      // service.getProfile 直接返回 user 对象（不含密码字段）
      type ProfileResp = {
        username?: string;
        password?: string;
        data?: { username?: string };
      };
      const body = res.body as ProfileResp;
      const username = body.username ?? body.data?.username;
      expect(username).toBe(ADMIN_USERNAME);
      // 关键：不能把 hash 泄出去
      const flat = JSON.stringify(res.body);
      expect(flat).not.toMatch(/\$2[aby]?\$/); // bcrypt hash 特征
    });

    it('GET /api/auth/profile with Cookie → 200', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Cookie', cookieHeader)
        .expect(200);
    });

    it('POST /api/auth/logout → 200 & clears cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(200);
      const setCookie = res.headers['set-cookie'] as string[] | undefined;
      const cookies = Array.isArray(setCookie) ? setCookie : [];
      const cleared = cookies.find((c) => c.startsWith('hp_token='));
      expect(cleared).toBeDefined();
      expect(cleared).toMatch(/Max-Age=0/);
    });
  });

  // ============================================================
  //  Step 4: 修改密码后旧密码失效 + 新密码可登录
  // ============================================================
  describe('Step 4 · change-password', () => {
    it('PUT /api/auth/change-password → 200', async () => {
      await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({ oldPassword: ADMIN_PASSWORD, newPassword: NEW_PASSWORD })
        .expect(200);
    });

    it('login with OLD password → 401', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
        .expect(401);
    });

    it('login with NEW password → 200 + refresh bearer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: NEW_PASSWORD })
        .expect(200);
      const body = res.body as { accessToken: string };
      bearerToken = body.accessToken;
    });
  });

  // ============================================================
  //  Step 5: 忘记密码 + 重置密码（关键路径）
  // ============================================================
  describe('Step 5 · forgot / reset password', () => {
    beforeEach(() => {
      captured.emailSent = false;
      captured.rawToken = null;
      captured.fallbackHits = 0;
    });

    it('forgot for nonexistent user → 仍返回 200（anti-enumeration）', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: 'does-not-exist' })
        .expect(200);
      const body = res.body as { message?: string };
      expect(body.message).toContain('如果该用户存在');
      expect(captured.rawToken).toBeNull(); // 没有为不存在的用户生成 token
    });

    it('forgot for real user → 生成 token（走 fallback，因为用户没绑邮箱）', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: ADMIN_USERNAME })
        .expect(200);
      // MailService.isSmtpEnabled=false，且用户没绑邮箱 → logResetTokenFallback
      expect(captured.fallbackHits).toBe(1);
      expect(captured.emailSent).toBe(false);
      expect(captured.rawToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('reset-password 用错的 token → 400', async () => {
      // 先生成一个 token 才有环境
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: ADMIN_USERNAME })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({
          token: 'f'.repeat(64), // 长度合法但不是真 token
          newPassword: 'yet-another-password-9',
        })
        .expect(400);
    });

    it('reset-password 用短密码 → 400 by DTO', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'f'.repeat(64), newPassword: 'short' })
        .expect(400);
    });

    it('reset-password 用短 token → 400 by DTO', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'tooShort', newPassword: 'valid-new-password-1' })
        .expect(400);
    });

    it('完整闭环：forgot → 拿到 token → reset → 用新密码登录', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: ADMIN_USERNAME })
        .expect(200);
      const token = captured.rawToken!;
      expect(token).toMatch(/^[a-f0-9]{64}$/);

      const RESET_PASSWORD = 'password-after-reset-7';
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token, newPassword: RESET_PASSWORD })
        .expect(200);

      // 老密码 401
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: NEW_PASSWORD })
        .expect(401);

      // 新密码 200
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: ADMIN_USERNAME, password: RESET_PASSWORD })
        .expect(200);
      const loginBody = res.body as { accessToken: string };
      expect(typeof loginBody.accessToken).toBe('string');

      // 同一个 token 不能二次使用
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token, newPassword: 'try-reuse-token-123' })
        .expect(400);
    });
  });

  // ============================================================
  //  Step 6: PASSWORD_RESET_ENABLED=false 时接口应返回 404
  // ============================================================
  describe('Step 6 · feature flag off', () => {
    afterEach(() => {
      process.env.PASSWORD_RESET_ENABLED = 'true';
    });

    it('forgot-password → 404 when feature disabled', async () => {
      process.env.PASSWORD_RESET_ENABLED = 'false';
      await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ username: ADMIN_USERNAME })
        .expect(404);
    });

    it('reset-password → 404 when feature disabled', async () => {
      process.env.PASSWORD_RESET_ENABLED = 'false';
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'f'.repeat(64), newPassword: 'anything-valid-1' })
        .expect(404);
    });
  });
});
