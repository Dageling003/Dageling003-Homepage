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
    ThrottlerModule.forRoot(
      process.env.THROTTLE_ENABLED === 'true'
        ? [{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT || 120) }]
        : [{ ttl: 60000, limit: 100000 }],
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    (() => {
      // 数据库选择（按简单 → 复杂排序）：
      //   DB_TYPE=sqlite  （默认）→ better-sqlite3，磁盘持久 + WAL，个人主页足够
      //   DB_TYPE=sqljs                → 纯内存 WASM（仅老开发档兜底，不推荐）
      //   DB_TYPE=mariadb              → 高级：多用户 / 大流量场景才需要
      //
      // 从「生产强制 MariaDB」改为「生产也默认 sqlite」是本次减负的核心：
      //   - Docker Compose 少一个 mariadb 服务，内存需求从 ≥2GB 降到 ≥512MB
      //   - 备份 = 直接 cp 单个 .sqlite 文件
      //   - 用户需要复杂查询 / 多副本时再显式改 DB_TYPE=mariadb
      const dbType = (process.env.DB_TYPE || 'sqlite').toLowerCase();
      const isProd = process.env.NODE_ENV === 'production';

      if (dbType === 'sqljs') {
        // 老的内存驱动，保留兼容；生产禁用（易丢数据）。
        if (isProd) {
          throw new Error(
            'DB_TYPE=sqljs is not permitted in production. Use DB_TYPE=sqlite (better-sqlite3).',
          );
        }
        const location = process.env.DB_SQLITE_PATH || 'data/homepage.sqlite';
        const dataDir = dirname(resolve(location));
        if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
        return TypeOrmModule.forRoot({
          type: 'sqljs',
          location,
          autoSave: true,
          entities: [User, SiteConfig, AuditLog, PasswordResetToken],
          synchronize: process.env.DB_SYNCHRONIZE !== 'false',
        });
      }

      if (dbType === 'mariadb') {
        return TypeOrmModule.forRoot({
          type: 'mariadb',
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
        });
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
        // 开发档兜底：sqljs 内存驱动

        console.warn(
          '[app.module] better-sqlite3 not installed, falling back to sqljs (dev only).',
        );
        return TypeOrmModule.forRoot({
          type: 'sqljs',
          location,
          autoSave: true,
          entities: [User, SiteConfig, AuditLog, PasswordResetToken],
          synchronize: process.env.DB_SYNCHRONIZE !== 'false',
        });
      }

      return TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: location,
        entities: [User, SiteConfig, AuditLog, PasswordResetToken],
        // sqlite 默认走 synchronize：无 migration 负担；想改 schema 精细控制时
        // 设 DB_SYNCHRONIZE=false 并跑 migration。
        synchronize: process.env.DB_SYNCHRONIZE !== 'false',
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
        migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
      });
    })(),
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
