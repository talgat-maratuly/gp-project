import { Module } from '@nestjs/common';
import { CitiesController, RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

@Module({
  controllers: [RegionsController, CitiesController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
