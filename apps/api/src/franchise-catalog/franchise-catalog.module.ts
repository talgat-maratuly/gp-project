import { Module } from '@nestjs/common';
import { FranchiseCatalogService } from './franchise-catalog.service';
import { FranchiseCatalogController } from './franchise-catalog.controller';
import { FranchiseCatalogAdminController } from './franchise-catalog-admin.controller';

@Module({
  controllers: [FranchiseCatalogController, FranchiseCatalogAdminController],
  providers: [FranchiseCatalogService],
  exports: [FranchiseCatalogService],
})
export class FranchiseCatalogModule {}
