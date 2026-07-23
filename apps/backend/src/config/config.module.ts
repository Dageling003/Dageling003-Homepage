import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteConfigController } from './config.controller';
import { SiteConfigService } from './config.service';
import { SiteConfig } from './entities/config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig])],
  controllers: [SiteConfigController],
  providers: [SiteConfigService],
})
export class SiteConfigModule implements OnModuleInit {
  constructor(private configService: SiteConfigService) {}

  async onModuleInit() {
    await this.configService.seedDefaults();
    await this.configService.migrateLegacyAvatar();
  }
}
