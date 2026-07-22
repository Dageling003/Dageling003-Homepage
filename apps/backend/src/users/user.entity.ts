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
