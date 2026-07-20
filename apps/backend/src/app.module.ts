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
      if (isSqlite) {
        const location = process.env.DB_SQLITE_PATH || 'data/homepage.sqlite';
        const dataDir = dirname(resolve(location));
        if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      }
      return isSqlite
        ? TypeOrmModule.forRoot({
            type: 'sqljs',
            location: process.env.DB_SQLITE_PATH || 'data/homepage.sqlite',
            autoSave: true,
            entities: [User, SiteConfig, AuditLog, PasswordResetToken],
            synchronize: true,
          })
        : TypeOrmModule.forRoot({
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
