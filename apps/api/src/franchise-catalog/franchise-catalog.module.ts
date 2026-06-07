import { Module } from '@nestjs/common';
import { FranchiseCatalogService } from './franchise-catalog.service';
import { FranchiseCatalogController } from './franchise-catalog.controller';
import { FranchiseCatalogAdminController } from './franchise-catalog-admin.controller';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';

@Module({
  imports: [ServiceCatalogModule],
  controllers: [FranchiseCatalogController, FranchiseCatalogAdminController],
  providers: [FranchiseCatalogService],
  exports: [FranchiseCatalogService],
})
export class FranchiseCatalogModule {}
