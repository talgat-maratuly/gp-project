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
import { ServiceProjectsModule } from './service-projects/service-projects.module';
import { CommonModule } from './common/common.module';
import { MarketModule } from './market/market.module';
import { RegionsModule } from './regions/regions.module';
import { QrModule } from './qr/qr.module';
import { FurnitureExecutorModule } from './furniture-executor/furniture-executor.module';
import { HealthController } from './health.controller';
import { HealthModule } from './health/health.module';
import { RbacModule } from './rbac/rbac.module';
import { UserStatusModule } from './user-status/user-status.module';
import { SpecialistRequestsModule } from './specialist-requests/specialist-requests.module';
import { SpecialistOnboardingModule } from './specialist-onboarding/specialist-onboarding.module';

@Module({
  controllers: [HealthController],
  imports: [
    HealthModule,
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
    CommonModule,
    RbacModule,
    UserStatusModule,
    SpecialistRequestsModule,
    SpecialistOnboardingModule,
    AuthModule,
    RegionsModule,
    PartnersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PartnerBalanceModule,
    GeoModule,
    NotificationsModule,
    AdminModule,
    ServiceProjectsModule,
    MarketModule,
    QrModule,
    FurnitureExecutorModule,
  ],
})
export class AppModule {}
