import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { FranchiseCatalogService } from './franchise-catalog.service';
import { CatalogBuilderService } from '../service-catalog/catalog-builder.service';

@ApiTags('services')
@Controller('services')
export class FranchiseCatalogController {
  constructor(
    private readonly legacyCatalog: FranchiseCatalogService,
    private readonly catalogBuilder: CatalogBuilderService,
  ) {}

  /** Клиент: қала/франшиза бойынша қызмет каталогы */
  @Get('catalog')
  @ApiQuery({ name: 'franchiseId', required: false })
  @ApiQuery({ name: 'cityId', required: false })
  async getCatalog(
    @Query('franchiseId') franchiseId?: string,
    @Query('cityId') cityId?: string,
  ) {
    const cid = cityId?.trim();
    if (cid) {
      let fid = franchiseId?.trim();
      if (!fid) {
        fid = (await this.catalogBuilder.resolveFranchiseIdForCity(cid)) ?? undefined;
      }
      const fromCity = await this.catalogBuilder.buildForCity(cid, fid);
      if (fromCity.length) return fromCity;
    }
    if (!franchiseId?.trim()) return [];
    const fid = franchiseId.trim();
    const fromCityPrices = await this.catalogBuilder.buildForFranchise(fid);
    if (fromCityPrices.length) return fromCityPrices;
    return this.legacyCatalog.listServices(fid);
  }

  @Get('franchises')
  listFranchises() {
    return this.legacyCatalog.listFranchises();
  }
}
