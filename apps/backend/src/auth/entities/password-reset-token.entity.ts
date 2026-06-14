import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

/**
 * 密码重置 token 表
 * - tokenHash：原始 token 不会明文入库，仅保存 SHA-256 哈希值
 * - expiresAt：硬过期时间（默认 15 分钟）
 * - usedAt：被使用的时间，避免重复使用
 */
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @Column({ name: 'user_id' })
  userId: number

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 64 })
  tokenHash: string

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ name: 'used_at', type: 'datetime', nullable: true })
  usedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
