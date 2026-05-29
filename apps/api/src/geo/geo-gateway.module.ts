import { Module } from '@nestjs/common';
import { GeoGateway } from './geo.gateway';

/** Вынесен отдельно, чтобы lifecycle и geo могли использовать gateway без циклов. */
@Module({
  providers: [GeoGateway],
  exports: [GeoGateway],
})
export class GeoGatewayModule {}
