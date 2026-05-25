import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('regions')
@Controller('regions')
export class RegionsController {
  constructor(private regions: RegionsService) {}

  @Get()
  list() {
    return this.regions.listActive();
  }
}
