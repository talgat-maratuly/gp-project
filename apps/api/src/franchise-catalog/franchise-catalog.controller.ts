import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { FranchiseCatalogService } from './franchise-catalog.service';

@ApiTags('services')
@Controller('services')
export class FranchiseCatalogController {
  constructor(private readonly catalogService: FranchiseCatalogService) {}

  /** Клиент: қала/франшиза бойынша қызмет каталогы */
  @Get('catalog')
  @ApiQuery({ name: 'franchiseId', required: true })
  getCatalog(@Query('franchiseId') franchiseId: string) {
    if (!franchiseId?.trim()) {
      return [];
    }
    return this.catalogService.listServices(franchiseId.trim());
  }

  @Get('franchises')
  listFranchises() {
    return this.catalogService.listFranchises();
  }
}
