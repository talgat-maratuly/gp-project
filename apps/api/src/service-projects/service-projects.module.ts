import { Module } from '@nestjs/common';
import { FurnitureExecutorModule } from '../furniture-executor/furniture-executor.module';
import {
  ServiceProjectsController,
  HunterProjectsController,
  FurnitureProjectsController,
} from './service-projects.controller';
import { ServiceProjectsService } from './service-projects.service';

@Module({
  imports: [FurnitureExecutorModule],
  controllers: [ServiceProjectsController, HunterProjectsController, FurnitureProjectsController],
  providers: [ServiceProjectsService],
  exports: [ServiceProjectsService],
})
export class ServiceProjectsModule {}
