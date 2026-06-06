import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLog } from './audit.entity'

export interface LogMeta {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  entityKey?: string
  detail?: string
  operator?: string
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(meta: LogMeta): Promise<AuditLog> {
    const entry = this.auditRepository.create(meta)
    return this.auditRepository.save(entry)
  }

  async findAll(page = 1, limit = 20): Promise<{ items: AuditLog[]; total: number }> {
    const [items, total] = await this.auditRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return { items, total }
  }
}
