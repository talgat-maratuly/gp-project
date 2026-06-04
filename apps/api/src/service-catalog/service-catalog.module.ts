import { Module } from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { CityPricesService } from './city-prices.service';
import { CatalogBuilderService } from './catalog-builder.service';
import { ServiceTypesAdminController } from './service-types-admin.controller';
import { CityPricesAdminController } from './city-prices-admin.controller';

@Module({
  controllers: [ServiceTypesAdminController, CityPricesAdminController],
  providers: [ServiceTypesService, CityPricesService, CatalogBuilderService],
  exports: [ServiceTypesService, CityPricesService, CatalogBuilderService],
})
export class ServiceCatalogModule {}
