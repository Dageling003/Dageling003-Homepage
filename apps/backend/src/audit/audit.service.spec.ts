import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './audit.entity';

/**
 * BUG-001 回归测试：确认 findAll 的时间过滤真的落到 TypeORM 的
 * Between / MoreThanOrEqual / LessThanOrEqual 上，而不是被 `{gte, lte}`
 * 那种伪操作符默默吞掉。
 */
describe('AuditService', () => {
  let service: AuditService;
  type FindArg = { where: Record<string, unknown> };
  const findAndCount = jest.fn<Promise<[AuditLog[], number]>, [FindArg]>(() =>
    Promise.resolve([[] as AuditLog[], 0] as [AuditLog[], number]),
  );
  const save = jest.fn<Promise<AuditLog | null>, [unknown]>();
  const create = jest.fn<unknown, [unknown]>((x) => x);

  const repo = { findAndCount, save, create };

  beforeEach(async () => {
    process.env.AUDIT_ENABLED = 'true';
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: repo },
      ],
    }).compile();
    service = mod.get(AuditService);
    findAndCount.mockClear();
    save.mockClear();
    create.mockClear();
  });

  describe('findAll date filter', () => {
    const firstWhere = () => findAndCount.mock.calls[0][0].where;

    it('should apply Between when both startDate and endDate given', async () => {
      await service.findAll(1, 20, {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
      expect(findAndCount).toHaveBeenCalledTimes(1);
      const op = firstWhere().createdAt as { _type?: string };
      expect(op._type).toBe('between');
    });

    it('should apply MoreThanOrEqual when only startDate given', async () => {
      await service.findAll(1, 20, { startDate: '2025-01-01' });
      const op = firstWhere().createdAt as { _type?: string };
      expect(op._type).toBe('moreThanOrEqual');
    });

    it('should apply LessThanOrEqual when only endDate given', async () => {
      await service.findAll(1, 20, { endDate: '2025-01-31' });
      const op = firstWhere().createdAt as { _type?: string };
      expect(op._type).toBe('lessThanOrEqual');
    });

    it('should end-of-day pad YYYY-MM-DD endDate', async () => {
      await service.findAll(1, 20, { endDate: '2025-01-31' });
      const op = firstWhere().createdAt as { value?: Date };
      expect(op.value?.getHours()).toBe(23);
      expect(op.value?.getMinutes()).toBe(59);
      expect(op.value?.getSeconds()).toBe(59);
    });

    it('should ignore invalid date strings gracefully', async () => {
      await service.findAll(1, 20, {
        startDate: 'not-a-date',
        endDate: 'nope',
      });
      expect(firstWhere().createdAt).toBeUndefined();
    });

    it('should not set createdAt when no date filter given', async () => {
      await service.findAll(1, 20, { operator: 'admin' });
      const where = firstWhere();
      expect(where.createdAt).toBeUndefined();
      expect(where.operator).toBe('admin');
    });
  });

  describe('log()', () => {
    it('should never throw when repo.save fails (audit is best-effort)', async () => {
      save.mockRejectedValueOnce(new Error('db down'));
      const result = await service.log({
        action: 'LOGIN_FAILED',
        entity: 'user',
      });
      expect(result).toBeNull();
    });

    it('should call create + save with meta', async () => {
      save.mockResolvedValueOnce({ id: 1 });
      const meta = { action: 'LOGIN_SUCCESS' as const, entity: 'user' };
      const r = await service.log(meta);
      expect(create).toHaveBeenCalledWith(meta);
      expect(save).toHaveBeenCalled();
      expect(r).toEqual({ id: 1 });
    });
  });

  // 保证以下 typeorm 符号都真的被 tree-shake 后仍可用（避免用错 API）
  it('typeorm operator sanity', () => {
    const a = Between(new Date(0), new Date(1));
    const b = MoreThanOrEqual(new Date(0));
    const c = LessThanOrEqual(new Date(0));
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(c).toBeDefined();
  });
});
