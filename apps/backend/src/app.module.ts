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
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    (() => {
      const isSqlite = process.env.DB_TYPE === 'sqlite';
      const isProd = process.env.NODE_ENV === 'production';
      if (isSqlite) {
        // BUG-005 修复：
        //  - sqljs 是纯内存 WASM 驱动，autoSave:true 每次写都要重刷整个
        //    .sqlite 文件，无 WAL、无并发锁、崩溃可能截断数据。仅适合
        //    开发/测试。
        //  - 生产严禁 DB_TYPE=sqlite：main.ts 已经 fail-fast 拦截；这里
        //    再兜底 throw，避免有人删除了 main.ts 的守卫。
        //  - synchronize 从「硬编码 true」改为环境变量控制，与 MariaDB
        //    分支的语义对齐（默认开发档开启，可通过 DB_SYNCHRONIZE=false
        //    显式关闭并使用 migration）。
        //  - 更强的替代品（better-sqlite3）需要本地 VS Build Tools，暂
        //    不作为默认依赖强推给所有开发者；后续可作为可选 native 分支。
        if (isProd) {
          throw new Error(
            'DB_TYPE=sqlite is not permitted in production. See main.ts fail-fast gate.',
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
        // Production connection pool settings
        extra: {
          connectionLimit: 20,
          connectTimeout: 10000,
          acquireTimeout: 10000,
          idleTimeout: 60000,
        },
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
