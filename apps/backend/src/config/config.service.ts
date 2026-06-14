import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from './entities/config.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfig)
    private configRepository: Repository<SiteConfig>,
    private auditService: AuditService,
  ) {}

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
    return this.configRepository.find({ order: { id: 'ASC' } });
  }

  async findByKey(key: string): Promise<SiteConfig> {
    const config = await this.configRepository.findOne({
      where: { configKey: key },
    });
    if (!config) {
      throw new NotFoundException(`配置项 '${key}' 不存在`);
    }
    return config;
  }

  async create(dto: CreateConfigDto, operator?: string): Promise<SiteConfig> {
    const existing = await this.configRepository.findOne({
      where: { configKey: dto.configKey },
    });
    if (existing) {
      throw new ConflictException(`配置项 '${dto.configKey}' 已存在`);
    }
    const config = this.configRepository.create(dto);
    const saved = await this.configRepository.save(config);
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
    return this.configRepository.find({
      where: { category },
      order: { id: 'ASC' },
    });
  }

  async findAllGrouped(): Promise<Record<string, SiteConfig[]>> {
    const all = await this.findAll();
    const grouped: Record<string, SiteConfig[]> = {};
    for (const item of all) {
      const cat = item.category || 'general';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }
    return grouped;
  }

  async update(
    key: string,
    dto: UpdateConfigDto,
    operator?: string,
  ): Promise<SiteConfig> {
    const config = await this.findByKey(key);
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

    const defaults: {
      configKey: string;
      configValue: string;
      category: string;
    }[] = [
      { configKey: 'name', configValue: '鹊楠', category: 'info' },
      { configKey: 'infoSex', configValue: '♂', category: 'info' },
      { configKey: 'infoSexDisplay', configValue: 'symbol', category: 'info' },
      { configKey: 'infoBirth', configValue: '2001-06-15', category: 'info' }, // 自动计算年龄和星座
      { configKey: 'infoProvince', configValue: '江苏省', category: 'info' },
      { configKey: 'infoSchool', configValue: '南通大学', category: 'info' },
      {
        configKey: 'avatarUrl',
        configValue: 'https://api.dicebear.com/7.x/thumbs/svg?seed=cat',
        category: 'info',
      },
      {
        configKey: 'professions',
        configValue: '["前端切图仔","摄影爱好者","猫猫教"]',
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
      { configKey: '_initialized', configValue: '0', category: 'system' },
    ];

    for (const item of defaults) {
      const config = this.configRepository.create(item);
      await this.configRepository.save(config);
    }
    console.log(`Default site config seeded (${defaults.length} items)`); // 模板变量用反引号
  }
}
