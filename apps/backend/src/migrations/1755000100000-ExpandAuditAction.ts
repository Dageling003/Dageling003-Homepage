import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BUG-003 修复配套：把 audit_logs.action 列宽度从 20 扩到 32，
 * 以容纳 LOGIN_SUCCESS / PASSWORD_RESET_COMPLETE 等新的安全事件枚举。
 * 直接改列类型即可，不需要迁移数据。
 */
export class ExpandAuditAction1755000100000 implements MigrationInterface {
  name = 'ExpandAuditAction1755000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // MariaDB / MySQL 语法。SQLite / better-sqlite3 不支持 MODIFY COLUMN，
    // 但在 sqlite 档下我们默认走 synchronize=true 自动同步元数据，因此
    // 用户不会在 sqlite 上运行本迁移（要跑必须显式 DB_MIGRATIONS_RUN=true）。
    // 默认部署路径是 SQLite，但本迁移也兼容 MariaDB 模式。
    const driver = queryRunner.connection.options.type;
    if (driver === 'mariadb' || driver === 'mysql') {
      await queryRunner.query(
        'ALTER TABLE `audit_logs` MODIFY COLUMN `action` varchar(32) NOT NULL',
      );
    } else {
      // SQLite/其他：安全兜底 —— 走 TypeORM 的 changeColumn 抽象
      await queryRunner.changeColumn(
        'audit_logs',
        'action',
        new (await import('typeorm')).TableColumn({
          name: 'action',
          type: 'varchar',
          length: '32',
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const driver = queryRunner.connection.options.type;
    if (driver === 'mariadb' || driver === 'mysql') {
      await queryRunner.query(
        'ALTER TABLE `audit_logs` MODIFY COLUMN `action` varchar(20) NOT NULL',
      );
    } else {
      await queryRunner.changeColumn(
        'audit_logs',
        'action',
        new (await import('typeorm')).TableColumn({
          name: 'action',
          type: 'varchar',
          length: '20',
          isNullable: false,
        }),
      );
    }
  }
}
