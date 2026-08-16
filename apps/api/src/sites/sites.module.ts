import { Module } from '@nestjs/common';
import { SitesController } from './sites.controller';
import { SiteSearchService } from './site-search.service';
import { SitesService } from './sites.service';

@Module({
  controllers: [SitesController],
  providers: [SitesService, SiteSearchService],
  exports: [SitesService, SiteSearchService],
})
export class SitesModule {}
