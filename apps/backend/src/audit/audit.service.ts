import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

export interface LogMeta {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityKey?: string;
  detail?: string;
  operator?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(meta: LogMeta): Promise<AuditLog> {
    const entry = this.auditRepository.create(meta);
    return this.auditRepository.save(entry);
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      action?: string;
      operator?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{ items: AuditLog[]; total: number }> {
    const where: Partial<Record<string, unknown>> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.operator) where.operator = filters.operator;
    if (filters?.startDate || filters?.endDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.startDate) createdAt.gte = new Date(filters.startDate);
      if (filters.endDate)
        createdAt.lte = new Date(filters.endDate + 'T23:59:59');
      where.createdAt = createdAt;
    }
    const [items, total] = await this.auditRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }
}
