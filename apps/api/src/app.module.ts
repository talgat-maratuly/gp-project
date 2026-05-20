import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PartnerBalanceModule } from './partner-balance/partner-balance.module';
import { GeoModule } from './geo/geo.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/api/.env',
        '.env',
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    AuthModule,
    PartnersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PartnerBalanceModule,
    GeoModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
