import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  // 32 长度足够容纳所有新增枚举（最长 PASSWORD_RESET_COMPLETE = 23）
  @Column({ length: 32 })
  action!: string; // 见 AuditAction 联合类型（audit.service.ts）

  @Column({ length: 30 })
  entity!: string; // 'config' | 'user'

  @Column({ name: 'entity_key', length: 100, nullable: true })
  entityKey!: string;

  @Column({ type: 'text', nullable: true })
  detail!: string;

  @Column({ length: 50, nullable: true })
  operator!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
