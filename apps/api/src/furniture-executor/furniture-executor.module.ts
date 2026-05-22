import { Module } from '@nestjs/common';
import { FurnitureExecutorController } from './furniture-executor.controller';
import { FurnitureExecutorService } from './furniture-executor.service';

@Module({
  controllers: [FurnitureExecutorController],
  providers: [FurnitureExecutorService],
  exports: [FurnitureExecutorService],
})
export class FurnitureExecutorModule {}
