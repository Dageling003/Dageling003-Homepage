import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 50, unique: true })
  username: string

  @Column()
  password: string

  @Column({ length: 10, default: 'admin' })
  role: string

  @Column({ length: 255, nullable: true })
  avatarUrl: string

  @Column({ length: 10, default: 'light' })
  theme: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
