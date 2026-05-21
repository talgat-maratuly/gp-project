import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoGateway } from '../geo/geo.gateway';
import { GeofenceService } from '../geo/geofence.service';
import { GpsTrackingService } from '../geo/gps-tracking.service';
import { AuthService } from '../auth/auth.service';
import { OrdersService } from '../orders/orders.service';
import { checkPrismaMigrations } from '../common/migration-check.util';

type CheckStatus = 'ok' | 'degraded' | 'error';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private geofence: GeofenceService,
    private gps: GpsTrackingService,
    private gateway: GeoGateway,
    private auth: AuthService,
    private orders: OrdersService,
  ) {}

  async full() {
    const started = Date.now();
    const [database, prisma, websocket, gpsModule, ordersModule, authModule, migrations, schema] =
      await Promise.all([
        this.checkDatabase(),
        this.checkPrismaClient(),
        this.checkWebsocket(),
        this.checkGpsModule(),
        this.checkOrdersModule(),
        this.checkAuthModule(),
        checkPrismaMigrations(this.prisma),
        this.checkSchema(),
      ]);

    const checks = {
      database,
      prisma,
      websocket,
      gps: gpsModule,
      orders: ordersModule,
      auth: authModule,
      migrations: {
        status: migrations.ok ? ('ok' as CheckStatus) : ('error' as CheckStatus),
        ...migrations,
      },
      schema,
    };

    const statuses = Object.values(checks).map((c) => c.status);
    const overall: CheckStatus = statuses.every((s) => s === 'ok')
      ? 'ok'
      : statuses.some((s) => s === 'error')
        ? 'error'
        : 'degraded';

    return {
      status: overall,
      service: 'gp-api',
      uptimeMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      checks,
      ports: {
        api: Number(process.env.PORT) || 4000,
        service: 5173,
        partner: 5174,
      },
      hints:
        overall !== 'ok'
          ? {
              killPorts: 'npm run kill:ports',
              startAll: 'npm run dev:all',
              migrate: migrations.fixCommand || 'npm run prisma:migrate:deploy',
            }
          : undefined,
    };
  }

  private async checkDatabase(): Promise<{ status: CheckStatus; message: string; latencyMs?: number }> {
    const t0 = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', message: 'PostgreSQL доступен', latencyMs: Date.now() - t0 };
    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'Database unreachable',
        hint: 'docker compose -f apps/api/docker-compose.yml up -d',
      } as { status: CheckStatus; message: string; hint?: string };
    }
  }

  private async checkPrismaClient() {
    try {
      await this.prisma.user.count();
      return { status: 'ok' as CheckStatus, message: 'Prisma client подключён' };
    } catch (e) {
      return {
        status: 'error' as CheckStatus,
        message: e instanceof Error ? e.message : 'Prisma error',
        hint: 'npm run prisma:generate && npm run prisma:migrate:deploy',
      };
    }
  }

  private checkWebsocket() {
    const hasServer = !!this.gateway.server;
    const sockets = hasServer ? this.gateway.server.engine?.clientsCount ?? 0 : 0;
    return {
      status: (hasServer ? 'ok' : 'error') as CheckStatus,
      message: hasServer ? `WebSocket /tracking активен (${sockets} клиентов)` : 'WebSocket server не инициализирован',
      namespace: '/tracking',
      clients: sockets,
    };
  }

  private async checkGpsModule() {
    try {
      const zones = await this.geofence.listOfficialDisposals();
      const hasGps = typeof this.gps.ingestGps === 'function';
      return {
        status: 'ok' as CheckStatus,
        message: 'GPS / geofence модуль загружен',
        geofenceZones: zones.length,
        gpsProcessor: hasGps,
      };
    } catch (e) {
      return {
        status: 'error' as CheckStatus,
        message: e instanceof Error ? e.message : 'GPS module error',
        kind: 'GPS',
      };
    }
  }

  private async checkOrdersModule() {
    try {
      const count = await this.prisma.order.count();
      const serviceOk = typeof this.orders.findForUser === 'function';
      return {
        status: 'ok' as CheckStatus,
        message: 'Orders module OK',
        ordersInDb: count,
        serviceLoaded: serviceOk,
      };
    } catch (e) {
      return {
        status: 'error' as CheckStatus,
        message: e instanceof Error ? e.message : 'Orders check failed',
      };
    }
  }

  private async checkAuthModule() {
    try {
      const users = await this.prisma.user.count();
      const hasAuth = typeof this.auth.login === 'function';
      return {
        status: hasAuth ? ('ok' as CheckStatus) : ('degraded' as CheckStatus),
        message: hasAuth ? 'Auth module OK' : 'Auth service partial',
        users,
      };
    } catch (e) {
      return {
        status: 'error' as CheckStatus,
        message: e instanceof Error ? e.message : 'Auth check failed',
        kind: 'AUTH',
      };
    }
  }

  private async checkSchema() {
    try {
      await this.prisma.order.findFirst({
        select: {
          id: true,
          status: true,
          clientLat: true,
          gpCommission: true,
          septicVolume: true,
        },
      });
      await this.prisma.geofenceZone.findFirst({ select: { id: true, lat: true, radiusM: true } });
      return { status: 'ok' as CheckStatus, message: 'Схема Order / GeofenceZone согласована с Prisma' };
    } catch (e) {
      return {
        status: 'error' as CheckStatus,
        message: e instanceof Error ? e.message : 'Schema mismatch',
        hint: 'npm run prisma:migrate:deploy && npm run prisma:generate',
      };
    }
  }
}
