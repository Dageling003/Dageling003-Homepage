import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class Initial1718400000000 implements MigrationInterface {
  name = 'Initial1718400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // users 表
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'username', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'password', type: 'varchar', isNullable: false },
          { name: 'role', type: 'varchar', length: '10', default: "'admin'" },
          { name: 'avatarUrl', type: 'varchar', length: '255', isNullable: true },
          { name: 'theme', type: 'varchar', length: '10', default: "'light'" },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    )

    // site_config 表
    await queryRunner.createTable(
      new Table({
        name: 'site_config',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'config_key', type: 'varchar', length: '50', isUnique: true, isNullable: false },
          { name: 'config_value', type: 'text', isNullable: false },
          { name: 'category', type: 'varchar', length: '50', default: "'general'" },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'datetime', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    )

    // audit_logs 表
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'action', type: 'varchar', length: '20', isNullable: false },
          { name: 'entity', type: 'varchar', length: '30', isNullable: false },
          { name: 'entity_key', type: 'varchar', length: '100', isNullable: true },
          { name: 'detail', type: 'text', isNullable: true },
          { name: 'operator', type: 'varchar', length: '50', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    )

    // password_reset_tokens 表
    await queryRunner.createTable(
      new Table({
        name: 'password_reset_tokens',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'user_id', type: 'int', isNullable: false },
          { name: 'token_hash', type: 'varchar', length: '64', isNullable: false },
          { name: 'expires_at', type: 'datetime', isNullable: false },
          { name: 'used_at', type: 'datetime', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    )

    // 索引
    await queryRunner.createIndex('password_reset_tokens', new TableIndex({ name: 'IDX_user_id', columnNames: ['user_id'] }))
    await queryRunner.createIndex('password_reset_tokens', new TableIndex({ name: 'IDX_token_hash', columnNames: ['token_hash'], isUnique: true }))
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('password_reset_tokens')
    await queryRunner.dropTable('audit_logs')
    await queryRunner.dropTable('site_config')
    await queryRunner.dropTable('users')
  }
}
