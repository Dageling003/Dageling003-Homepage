import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { SiteConfigModule } from './config/config.module'
import { AuditModule } from './audit/audit.module'
import { User } from './users/user.entity'
import { SiteConfig } from './config/entities/config.entity'
import { AuditLog } from './audit/audit.entity'

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 120,
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'homepage',
      entities: [User, SiteConfig, AuditLog],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      // Production connection pool settings
      extra: {
        connectionLimit: 20,
        connectTimeout: 10000,
        acquireTimeout: 10000,
        idleTimeout: 60000,
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
