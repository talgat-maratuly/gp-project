import { forwardRef, Module } from '@nestjs/common';
import { PartnersModule } from '../partners/partners.module';
import { FurnitureExecutorController } from './furniture-executor.controller';
import { FurnitureExecutorService } from './furniture-executor.service';

@Module({
  imports: [forwardRef(() => PartnersModule)],
  controllers: [FurnitureExecutorController],
  providers: [FurnitureExecutorService],
  exports: [FurnitureExecutorService],
})
export class FurnitureExecutorModule {}
