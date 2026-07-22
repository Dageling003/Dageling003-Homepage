import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordChangedAt1735689600000 implements MigrationInterface {
  name = 'AddPasswordChangedAt1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_changed_at',
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'password_changed_at');
  }
}
