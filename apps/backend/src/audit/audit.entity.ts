import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  action: string; // 'CREATE' | 'UPDATE' | 'DELETE'

  @Column({ length: 30 })
  entity: string; // 'config' | 'user'

  @Column({ name: 'entity_key', length: 100, nullable: true })
  entityKey: string;

  @Column({ type: 'text', nullable: true })
  detail: string;

  @Column({ length: 50, nullable: true })
  operator: string;

  @CreateDateColumn()
  createdAt: Date;
}
