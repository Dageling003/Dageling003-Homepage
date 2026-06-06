import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('site_config')
export class SiteConfig {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'config_key', length: 50, unique: true })
  configKey: string

  @Column({ name: 'config_value', type: 'text' })
  configValue: string

  @Column({ name: 'category', length: 50, default: 'general' })
  category: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
