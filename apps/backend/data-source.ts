import { DataSource } from 'typeorm'
import { join } from 'path'
import { User } from './src/users/user.entity'
import { SiteConfig } from './src/config/entities/config.entity'
import { AuditLog } from './src/audit/audit.entity'
import { PasswordResetToken } from './src/auth/entities/password-reset-token.entity'

/**
 * TypeORM CLI 数据源配置
 * 用法：
 *   npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:generate -d data-source.ts src/migrations/Initial
 *   npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:run -d data-source.ts
 */
export default new DataSource({
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'homepage',
  entities: [User, SiteConfig, AuditLog, PasswordResetToken],
  migrations: [join(__dirname, 'src', 'migrations', '*{.ts,.js}')],
  synchronize: false,
})
