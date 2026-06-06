import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { SiteConfigModule } from './config/config.module'
import { AuditModule } from './audit/audit.module'
import { User } from './users/user.entity'
import { SiteConfig } from './config/entities/config.entity'
import { AuditLog } from './audit/audit.entity'

@Module({
  imports: [
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
      database: process.env.DB_DATABASE || 'Dageling003-Homepage',
      entities: [User, SiteConfig, AuditLog],
      synchronize: true,
    }),
    AuthModule,
    SiteConfigModule,
    AuditModule,
  ],
})
export class AppModule {}
