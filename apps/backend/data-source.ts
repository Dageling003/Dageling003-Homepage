import { DataSource } from 'typeorm'
import { join } from 'path'

const isSqlite = process.env.DB_TYPE === 'sqlite'

export default new DataSource(
  isSqlite
    ? {
        type: 'sqljs',
        location: process.env.DB_SQLITE_PATH || 'data/homepage.sqlite',
        autoSave: true,
        entities: [join(__dirname, 'src', 'users', 'user.entity{.ts,.js}'),
                   join(__dirname, 'src', 'config', 'entities', 'config.entity{.ts,.js}'),
                   join(__dirname, 'src', 'audit', 'audit.entity{.ts,.js}'),
                   join(__dirname, 'src', 'auth', 'entities', 'password-reset-token.entity{.ts,.js}')],
        synchronize: true,
      }
    : {
        type: 'mariadb',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'homepage',
        entities: [join(__dirname, 'src', 'users', 'user.entity{.ts,.js}'),
                   join(__dirname, 'src', 'config', 'entities', 'config.entity{.ts,.js}'),
                   join(__dirname, 'src', 'audit', 'audit.entity{.ts,.js}'),
                   join(__dirname, 'src', 'auth', 'entities', 'password-reset-token.entity{.ts,.js}')],
        migrations: [join(__dirname, 'src', 'migrations', '*{.ts,.js}')],
        synchronize: false,
      },
)
