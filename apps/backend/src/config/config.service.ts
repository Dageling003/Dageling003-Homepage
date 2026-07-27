import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from './entities/config.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuditService } from '../audit/audit.service';
import { assertConfigValueShape } from './dto/config-value.validators';

@Injectable()
export class SiteConfigService {
  private readonly logger = new Logger(SiteConfigService.name);
  private cache = new Map<string, { value: unknown; expires: number }>();
  private readonly CACHE_TTL_MS = 30_000;

  constructor(
    @InjectRepository(SiteConfig)
    private configRepository: Repository<SiteConfig>,
    private auditService: AuditService,
  ) {}

  private getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value as T;
    }
    if (entry) this.cache.delete(key);
    return undefined;
  }

  private setCache<T>(key: string, value: T, ttlMs = this.CACHE_TTL_MS): void {
    this.cache.set(key, { value, expires: Date.now() + ttlMs });
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  async isInitialized(): Promise<boolean> {
    // Check if _initialized flag exists
    const flag = await this.configRepository.findOne({
      where: { configKey: '_initialized' },
    });
    if (flag) return flag.configValue === '1';
    // No flag yet: count non-system configs to detect if setup is needed
    const count = await this.configRepository.count({
      where: { category: 'info' },
    });
    return count >= 3; // has at least some real data
  }

  async findAll(): Promise<SiteConfig[]> {
    const cached = this.getCached<SiteConfig[]>('all');
    if (cached) return cached;
    const result = await this.configRepository.find({ order: { id: 'ASC' } });
    this.setCache('all', result);
    return result;
  }

  async findByKey(key: string): Promise<SiteConfig> {
    const cached = this.getCached<SiteConfig>(`key:${key}`);
    if (cached) return cached;
    const config = await this.configRepository.findOne({
      where: { configKey: key },
    });
    if (!config) {
      throw new NotFoundException(`配置项 '${key}' 不存在`);
    }
    this.setCache(`key:${key}`, config);
    return config;
  }

  async create(dto: CreateConfigDto, operator?: string): Promise<SiteConfig> {
    const existing = await this.configRepository.findOne({
      where: { configKey: dto.configKey },
    });
    if (existing) {
      throw new ConflictException(`配置项 '${dto.configKey}' 已存在`);
    }
    // BUG-006 修复：对已知 JSON shape 的 key 做结构校验，脏数据无法入库
    try {
      assertConfigValueShape(dto.configKey, dto.configValue);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }
    const config = this.configRepository.create(dto);
    const saved = await this.configRepository.save(config);
    this.invalidateCache();
    // 截断长配置值，避免审计日志泄露完整个人信息
    const truncatedValue =
      saved.configValue.length > 100
        ? saved.configValue.slice(0, 100) + '…'
        : saved.configValue;
    await this.auditService.log({
      action: 'CREATE',
      entity: 'config',
      entityKey: saved.configKey,
      detail: JSON.stringify({
        configKey: saved.configKey,
        configValue: truncatedValue,
        category: saved.category,
      }),
      operator,
    });
    return saved;
  }

  async findByCategory(category: string): Promise<SiteConfig[]> {
    const cacheKey = `cat:${category}`;
    const cached = this.getCached<SiteConfig[]>(cacheKey);
    if (cached) return cached;
    const result = await this.configRepository.find({
      where: { category },
      order: { id: 'ASC' },
    });
    this.setCache(cacheKey, result);
    return result;
  }

  async findAllGrouped(): Promise<Record<string, SiteConfig[]>> {
    const cached = this.getCached<Record<string, SiteConfig[]>>('grouped');
    if (cached) return cached;
    const all = await this.findAll();
    const grouped: Record<string, SiteConfig[]> = {};
    for (const item of all) {
      const cat = item.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
    this.setCache('grouped', grouped);
    return grouped;
  }

  async update(
    key: string,
    dto: UpdateConfigDto,
    operator?: string,
  ): Promise<SiteConfig> {
    const config = await this.findByKey(key);
    // BUG-006 修复：更新链路同样阻断脏 JSON 入库
    if (dto.configValue !== undefined) {
      try {
        assertConfigValueShape(key, dto.configValue);
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : String(err),
        );
      }
    }
    // 截断旧值用于审计日志，避免泄露完整个人信息
    const truncate = (v: string) =>
      v.length > 100 ? v.slice(0, 100) + '…' : v;
    const oldDetail = JSON.stringify({
      configKey: config.configKey,
      configValue: truncate(config.configValue),
      category: config.category,
    });
    const updates: Partial<SiteConfig> = {};
    if (dto.configValue !== undefined) updates.configValue = dto.configValue;
    if (dto.category !== undefined) updates.category = dto.category;
    Object.assign(config, updates);
    const saved = await this.configRepository.save(config);
    this.invalidateCache();
    await this.auditService.log({
      action: 'UPDATE',
      entity: 'config',
      entityKey: saved.configKey,
      detail: JSON.stringify({
        before: oldDetail,
        after: {
          configValue: truncate(saved.configValue),
          category: saved.category,
        },
      }),
      operator,
    });
    return saved;
  }

  async delete(key: string, operator?: string): Promise<void> {
    const config = await this.findByKey(key);
    await this.configRepository.remove(config);
    this.invalidateCache();
    const truncate = (v: string) =>
      v && v.length > 100 ? v.slice(0, 100) + '…' : v;
    await this.auditService.log({
      action: 'DELETE',
      entity: 'config',
      entityKey: key,
      detail: JSON.stringify({
        configKey: config.configKey,
        configValue: truncate(config.configValue),
      }),
      operator,
    });
  }

  async seedDefaults(): Promise<void> {
    const count = await this.configRepository.count();
    if (count > 0) return;

    // BUG-004 修复：seed 数据一律使用占位符，避免任何人 fork 部署后未配置
    // 就把原作者姓名/生日/学校/省份泄露到公网首页。占位内容与 README 说的
    // 「截图中隐私信息已替换为占位符」保持同一口径。
    const defaults: {
      configKey: string;
      configValue: string;
      category: string;
    }[] = [
      { configKey: 'name', configValue: '示例姓名', category: 'info' },
      { configKey: 'infoSex', configValue: '♂', category: 'info' },
      { configKey: 'infoSexDisplay', configValue: 'symbol', category: 'info' },
      { configKey: 'infoBirth', configValue: '2000-01-01', category: 'info' }, // 自动计算年龄和星座
      { configKey: 'infoProvince', configValue: '示例省份', category: 'info' },
      { configKey: 'infoSchool', configValue: '示例大学', category: 'info' },
      {
        configKey: 'avatarUrl',
        configValue: '/default-avatar.svg',
        category: 'info',
      },
      {
        configKey: 'professions',
        configValue: '["示例职业 A","示例职业 B","示例爱好"]',
        category: 'info',
      },
      { configKey: 'infoShowName', configValue: '1', category: 'info' },
      { configKey: 'infoShowZodiac', configValue: '1', category: 'info' },
      { configKey: 'infoAgeDisplay', configValue: 'all', category: 'info' },
      { configKey: 'infoShowBirth', configValue: '1', category: 'info' },
      {
        configKey: 'links',
        configValue:
          '[{"text":"博客","color":"#f59e0b","url":"https://example.com/blog"},{"text":"GitHub","color":"#333333","url":"https://github.com"},{"text":"Bilibili","color":"#fb7299","url":"https://bilibili.com"},{"text":"邮箱","color":"#ea4335","url":"mailto:hello@example.com"}]',
        category: 'links',
      },
      {
        configKey: 'techs',
        configValue:
          '[{"name":"HTML"},{"name":"CSS"},{"name":"JavaScript"},{"name":"Vue"},{"name":"TypeScript"},{"name":"Vite"},{"name":"Git"},{"name":"Linux"}]',
        category: 'techs',
      },
      {
        configKey: 'todos',
        configValue:
          '[{"text":"学 Java","done":false},{"text":"学 Android","done":false},{"text":"学英语","done":false},{"text":"回顾首页","done":true}]',
        category: 'todos',
      },
      {
        configKey: 'typewriterWords',
        configValue:
          '["欢迎来到我的主页 🎉","生活不止眼前的苟且，还有诗和远方","累了就休息一下吧~ 😊","May you happy every day ✨"]',
        category: 'todos',
      },
      {
        configKey: 'footerText',
        configValue: '© 2026 示例站点',
        category: 'info',
      },
      { configKey: 'seoOgLocale', configValue: 'zh_CN', category: 'info' },
      {
        configKey: 'seoTwitterCard',
        configValue: 'summary_large_image',
        category: 'info',
      },
      {
        configKey: 'introGreeting',
        configValue: '你好鸭，很高兴认识你👋',
        category: 'info',
      },
      {
        configKey: 'cardHeaderTech',
        configValue: '🛠️ 技术栈',
        category: 'info',
      },
      {
        configKey: 'cardHeaderTodo',
        configValue: '📃 鸽子计划',
        category: 'info',
      },
      { configKey: '_initialized', configValue: '0', category: 'system' },
    ];

    for (const item of defaults) {
      const config = this.configRepository.create(item);
      await this.configRepository.save(config);
    }
    this.logger.log(`Default site config seeded (${defaults.length} items)`);
  }

  /**
   * Idempotent migration: rewrite the legacy default avatar URL
   * (api.dicebear.com/7.x/thumbs/svg?seed=cat) to the bundled local SVG
   * so the homepage never breaks when third-party avatar CDNs are
   * unreachable. Only touches the exact legacy default value — users
   * who actively configured a custom avatar URL are left untouched.
   * Safe to run on every boot.
   */
  async migrateLegacyAvatar(): Promise<void> {
    const LEGACY_DEFAULT = 'https://api.dicebear.com/7.x/thumbs/svg?seed=cat';
    const row = await this.configRepository.findOne({
      where: { configKey: 'avatarUrl' },
    });
    if (!row) return;
    if (row.configValue === LEGACY_DEFAULT) {
      row.configValue = '/default-avatar.svg';
      await this.configRepository.save(row);
      this.logger.log(
        `Migrated legacy default avatarUrl -> /default-avatar.svg`,
      );
    }
  }
}
