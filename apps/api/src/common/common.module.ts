import { Global, Module } from '@nestjs/common';
import { RegionAccessService } from './region-access.service';

@Global()
@Module({
  providers: [RegionAccessService],
  exports: [RegionAccessService],
})
export class CommonModule {}
