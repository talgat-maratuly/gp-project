import { Module } from '@nestjs/common';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';

@Module({
  imports: [FurnitureExecutorModule],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
