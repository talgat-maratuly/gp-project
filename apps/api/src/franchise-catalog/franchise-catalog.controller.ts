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
    const mergeByTemplateId = (
      cityPrices: Array<Record<string, unknown>>,
      legacy: Array<Record<string, unknown>>,
    ) => {
      const templates = new Set(
        cityPrices.map((service) => String(service.templateId || '')).filter(Boolean),
      );
      return [
        ...cityPrices,
        ...legacy.filter((service) => !templates.has(String(service.templateId || ''))),
      ];
    };

    if (cid) {
      let fid = franchiseId?.trim();
      if (!fid) {
        fid = (await this.catalogBuilder.resolveFranchiseIdForCity(cid)) ?? undefined;
      }
      const fromCity = await this.catalogBuilder.buildForCity(cid, fid);
      const legacy = fid ? await this.legacyCatalog.listServices(fid) : [];
      if (fromCity.length) return mergeByTemplateId(fromCity, legacy);
      if (legacy.length) return legacy;
    }
    if (!franchiseId?.trim()) return [];
    const fid = franchiseId.trim();
    const fromCityPrices = await this.catalogBuilder.buildForFranchise(fid);
    const legacy = await this.legacyCatalog.listServices(fid);
    if (fromCityPrices.length) return mergeByTemplateId(fromCityPrices, legacy);
    return legacy;
  }

  @Get('franchises')
  listFranchises() {
    return this.legacyCatalog.listFranchises();
  }
}
