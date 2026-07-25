import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join, dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthModule } from './auth/auth.module';
import { SiteConfigModule } from './config/config.module';
import { AuditModule } from './audit/audit.module';
import { User } from './users/user.entity';
import { SiteConfig } from './config/entities/config.entity';
import { AuditLog } from './audit/audit.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';

@Module({
  imports: [
    // 全局限流：默认关闭（个人主页流量极小，不需要）。
    // 想开启：设置 THROTTLE_ENABLED=true。
    // 注意：登录接口 /auth/login 上的 @Throttle 装饰器仍然生效（防暴力破解，
    // 硬编码 5 次/分钟），与全局限流开关无关。
    // e2e 场景（NODE_ENV=test）通过 skipIf 全局跳过限流，避免顺序执行的
    // 多次 login 打到 5/60s 上限，无需在测试里再 overrideGuard。
    ThrottlerModule.forRoot({
      throttlers:
        process.env.THROTTLE_ENABLED === 'true'
          ? [{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT || 120) }]
          : [{ ttl: 60000, limit: 100000 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      // 用 useFactory 而不是同步 IIFE：让 factory 在 Nest bootstrap 时才读
      // process.env。同步 IIFE 会在 @Module({...}) 装饰器求值阶段（也就是
      // AppModule 被 import 的那一刻）就执行，早于 e2e beforeAll 里对 env
      // 的覆盖，导致测试跑在本地 .env 指向的库上（数据串场 / 老用户残留）。
      useFactory: () => {
        // 数据库选择（按简单 → 复杂排序）：
        //   DB_TYPE=sqlite  （默认）→ better-sqlite3，磁盘持久 + WAL，个人主页足够
        //   DB_TYPE=sqljs                → 纯内存 WASM（e2e / 老开发档兜底）
        //   DB_TYPE=mariadb              → 高级：多用户 / 大流量场景才需要
        //
        // 从「生产强制 MariaDB」改为「生产也默认 sqlite」是本次减负的核心：
        //   - Docker Compose 少一个 mariadb 服务，内存需求从 ≥2GB 降到 ≥512MB
        //   - 备份 = 直接 cp 单个 .sqlite 文件
        //   - 用户需要复杂查询 / 多副本时再显式改 DB_TYPE=mariadb
        const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
        const isProd = process.env.NODE_ENV === 'production';

        if (dbType === 'sqljs') {
          if (isProd) {
            throw new Error(
              'DB_TYPE=sqljs is not permitted in production. Use DB_TYPE=sqlite (better-sqlite3).',
            );
          }
          const location =
            process.env.DB_SQLITE_PATH || 'data/homepage.sqlite';
          const dataDir = dirname(resolve(location));
          if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
          return {
            type: 'sqljs' as const,
            location,
            autoSave: true,
            entities: [User, SiteConfig, AuditLog, PasswordResetToken],
            synchronize: process.env.DB_SYNCHRONIZE !== 'false',
          };
        }

        if (dbType === 'mariadb') {
          return {
            type: 'mariadb' as const,
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'homepage',
            entities: [User, SiteConfig, AuditLog, PasswordResetToken],
            synchronize: process.env.DB_SYNCHRONIZE === 'true',
            migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
            migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
            extra: {
              connectionLimit: 20,
              connectTimeout: 10000,
              acquireTimeout: 10000,
              idleTimeout: 60000,
            },
          };
        }

        // 默认：better-sqlite3。磁盘持久，WAL，无并发问题。
        // Windows 本地开发若缺少 VS 编译器可能装不上，此时降级到 sqljs 内存驱动
        // （加载体验一致，只是每次写都会重刷整个文件，仅适合开发）。
        const location = process.env.DB_SQLITE_PATH || 'data/homepage.sqlite';
        const dataDir = dirname(resolve(location));
        if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

        let hasBetterSqlite = false;
        try {
          require.resolve('better-sqlite3');
          hasBetterSqlite = true;
        } catch {
          hasBetterSqlite = false;
        }

        if (!hasBetterSqlite) {
          if (isProd) {
            throw new Error(
              'better-sqlite3 not installed. Run `pnpm install` inside the Docker image, ' +
                'or set DB_TYPE=mariadb.',
            );
          }
          console.warn(
            '[app.module] better-sqlite3 not installed, falling back to sqljs (dev only).',
          );
          return {
            type: 'sqljs' as const,
            location,
            autoSave: true,
            entities: [User, SiteConfig, AuditLog, PasswordResetToken],
            synchronize: process.env.DB_SYNCHRONIZE !== 'false',
          };
        }

        return {
          type: 'better-sqlite3' as const,
          database: location,
          entities: [User, SiteConfig, AuditLog, PasswordResetToken],
          // sqlite 默认走 synchronize：无 migration 负担；想改 schema 精细控制时
          // 设 DB_SYNCHRONIZE=false 并跑 migration。
          synchronize: process.env.DB_SYNCHRONIZE !== 'false',
          migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
        };
      },
    }),
    AuthModule,
    SiteConfigModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
