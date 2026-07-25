import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { AuditLog } from './audit.entity';

/**
 * 审计动作枚举。
 * - CREATE / UPDATE / DELETE：数据变更（保留原语义）
 * - LOGIN_SUCCESS / LOGIN_FAILED：登录成功 / 失败（用户名 + IP）
 * - PASSWORD_CHANGE：已登录用户主动改密
 * - PASSWORD_RESET_REQUEST：申请重置链接（不区分用户是否存在，避免枚举）
 * - PASSWORD_RESET_COMPLETE：使用 token 完成重置
 * - ADMIN_CREATED：首个管理员创建（一次性事件，价值高）
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'ADMIN_CREATED';

export interface LogMeta {
  action: AuditAction;
  entity: string;
  entityKey?: string;
  detail?: string;
  operator?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * 写审计日志。故意不抛错：审计失败绝不能把主业务流程拖垮
   * （例如登录成功后写审计日志失败不能让用户拿不到 token）。
   */
  async log(meta: LogMeta): Promise<AuditLog | null> {
    try {
      const entry = this.auditRepository.create(meta);
      return await this.auditRepository.save(entry);
    } catch (err) {
      this.logger.error(
        `[AuditService] Failed to write audit log (action=${meta.action}, entity=${meta.entity}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
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
    const where: FindOptionsWhere<AuditLog> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.operator) where.operator = filters.operator;

    // BUG-001 fix: 之前用 `{ gte, lte }` 对象字面量赋给 where.createdAt，
    // TypeORM 无法识别这种伪操作符（并非 Prisma/Mongo 语法），实际会退化成
    // 「按对象整体做相等匹配」，导致时间过滤形同虚设。改为 TypeORM 官方
    // FindOperator：Between / MoreThanOrEqual / LessThanOrEqual。
    if (filters?.startDate || filters?.endDate) {
      const start = filters?.startDate
        ? this.parseStart(filters.startDate)
        : undefined;
      const end = filters?.endDate ? this.parseEnd(filters.endDate) : undefined;
      if (start && end) {
        // Between 是闭区间 [start, end]
        where.createdAt = Between(start, end);
      } else if (start) {
        where.createdAt = MoreThanOrEqual(start);
      } else if (end) {
        where.createdAt = LessThanOrEqual(end);
      }
    }

    const [items, total] = await this.auditRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  /**
   * 前端传的 startDate/endDate 一般是 `YYYY-MM-DD`。为了让「当天」也能命中，
   * endDate 补到 23:59:59.999。同时对无法解析的字符串返回 undefined，避免
   * 把 `Invalid Date` 塞进 SQL。
   */
  private parseStart(raw: string): Date | undefined {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  private parseEnd(raw: string): Date | undefined {
    // 纯日期 (YYYY-MM-DD) 补到当天末尾；带时分秒的原样解析。
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
    const d = new Date(isDateOnly ? `${raw}T23:59:59.999` : raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
}
