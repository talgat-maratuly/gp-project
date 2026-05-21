import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoModule } from '../geo/geo.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, GeoModule, AuthModule, OrdersModule],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
