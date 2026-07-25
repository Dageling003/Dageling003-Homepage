import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * BUG-002 修复：给 users 表补 email 列。
 * - 254 长度（RFC 5321 邮件地址上限）
 * - 允许为空：老部署升级后管理员可能还没在个人资料里填邮箱，
 *   密码重置流程会自动降级到日志输出（见 auth.service.ts）
 * - 不加 unique 约束：管理员可能共享同一个运维邮箱；未来若开放
 *   注册再单独收紧
 */
export class AddUserEmail1755000000000 implements MigrationInterface {
  name = 'AddUserEmail1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        length: '254',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'email');
  }
}
