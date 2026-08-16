import { Module } from '@nestjs/common';
import { SitesModule } from '../sites/sites.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ImportService } from './import.service';

@Module({
  imports: [SitesModule],
  controllers: [AdminController],
  providers: [AdminService, ImportService],
})
export class AdminModule {}
