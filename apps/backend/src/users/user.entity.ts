import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  /**
   * 用户邮箱：用于密码重置邮件收件人（BUG-002 修复）。
   * - 可空：老用户升级后无邮箱，密码重置流程会自动降级到日志输出
   * - 未加 unique：管理员可能共享同一个运维邮箱；如后续开放注册再考虑收紧
   * - 显式声明 `type: 'varchar'`：TS 联合类型 `string | null` 会让 TypeORM
   *   把列类型推断成 "Object"，sqljs 会直接报 DataTypeNotSupportedError
   */
  @Column({ type: 'varchar', length: 254, nullable: true })
  email: string | null;

  @Column()
  password: string;

  @Column({ length: 10, default: 'admin' })
  role: string;

  @Column({ length: 255, nullable: true })
  avatarUrl: string;

  @Column({ length: 10, default: 'light' })
  theme: string;

  /**
   * 密码最后一次变更的时间。用于让旧 JWT 立即失效：
   * jwt.strategy 会在校验时对比 payload.iat < passwordChangedAt / 1000。
   */
  @Column({ type: 'datetime', nullable: true, name: 'password_changed_at' })
  passwordChangedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
