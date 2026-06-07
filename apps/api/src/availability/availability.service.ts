import { Injectable } from '@nestjs/common';
import { OrderCategory, OrderStatus, PartnerDirection, PartnerStatus, WorkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSERVICE_TO_DIRECTION } from '../common/partner-offerings.util';

const ACTIVE_ORDER_STATUSES = [OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.IN_PROCESS];

function directionForService(serviceId?: string | null): PartnerDirection | null {
  if (!serviceId) return null;
  return SUBSERVICE_TO_DIRECTION[serviceId] || null;
}

function estimateEtaFreeAt(status: WorkStatus): Date | null {
  if (status === WorkStatus.BUSY) return new Date(Date.now() + 45 * 60 * 1000);
  if (status === WorkStatus.ON_ROUTE) return new Date(Date.now() + 25 * 60 * 1000);
  return null;
}

function normalizeVolume(raw: unknown): number | null {
  const n = Number(raw);
  if (![3, 5, 7, 10, 15].includes(n)) return null;
  return n;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async publicServiceAvailability(params: { city?: string; serviceId?: string; category?: OrderCategory }) {
    const city = params.city?.trim();
    const direction = directionForService(params.serviceId);
    const partners = await this.prisma.partnerProfile.findMany({
      where: {
        status: PartnerStatus.APPROVED,
        ...(city ? { city } : {}),
        ...(direction ? { directions: { has: direction } } : {}),
      },
      include: {
        serviceOfferings: true,
        orders: {
          where: { status: { in: ACTIVE_ORDER_STATUSES } },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        vehicles: true,
        specialistRequests: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { vehicleData: true },
        },
      },
    });

    const online = partners.filter((p) => p.workStatus !== WorkStatus.OFFLINE);
    const free = partners.filter((p) => p.workStatus === WorkStatus.ONLINE && p.orders.length === 0);
    const onRoute = partners.filter((p) => p.workStatus === WorkStatus.ON_ROUTE || p.orders[0]?.status === OrderStatus.ACCEPTED || p.orders[0]?.status === OrderStatus.ON_WAY);
    const busy = partners.filter((p) => p.workStatus === WorkStatus.BUSY || p.orders[0]?.status === OrderStatus.IN_PROCESS);
    const etaFreeAt = [...onRoute, ...busy]
      .map((p) => estimateEtaFreeAt(p.workStatus))
      .filter(Boolean)
      .sort((a, b) => a!.getTime() - b!.getTime())[0] || null;

    const vehicleCounts = new Map<number, number>();
    for (const partner of partners) {
      const saved = partner.vehicles.filter((v) => v.category === OrderCategory.SEPTIC);
      if (saved.length) {
        for (const v of saved) {
          const volume = normalizeVolume(v.volumeM3);
          if (volume) vehicleCounts.set(volume, (vehicleCounts.get(volume) || 0) + v.quantity);
        }
        continue;
      }
      const maybeVehicleData = partner.specialistRequests[0]?.vehicleData as any;
      const volume = normalizeVolume(maybeVehicleData?.tankVolume);
      if (volume) vehicleCounts.set(volume, (vehicleCounts.get(volume) || 0) + 1);
    }

    const vehicles = [...vehicleCounts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([volumeM3, quantity]) => ({ volumeM3, quantity }));

    return {
      city: city || null,
      serviceId: params.serviceId || null,
      registered: partners.length,
      online: online.length,
      free: free.length,
      busy: busy.length,
      onRoute: onRoute.length,
      offline: Math.max(0, partners.length - online.length),
      etaFreeAt: etaFreeAt?.toISOString() || null,
      etaFreeMinutes: etaFreeAt ? Math.max(1, Math.round((etaFreeAt.getTime() - Date.now()) / 60000)) : null,
      vehicles,
      privacy: 'exact_location_hidden_until_order_accepted',
    };
  }

  async adminSummary() {
    const partners = await this.prisma.partnerProfile.findMany({
      where: { status: PartnerStatus.APPROVED },
      include: {
        user: { select: { id: true, name: true, phone: true, accountStatus: true } },
        orders: {
          where: { status: { in: ACTIVE_ORDER_STATUSES } },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ city: 'asc' }, { updatedAt: 'desc' }],
    });
    const byCity = new Map<string, { city: string; registered: number; online: number; free: number; busy: number; onRoute: number; offline: number }>();
    for (const p of partners) {
      const city = p.city || '—';
      const row = byCity.get(city) || { city, registered: 0, online: 0, free: 0, busy: 0, onRoute: 0, offline: 0 };
      row.registered += 1;
      if (p.workStatus === WorkStatus.OFFLINE) row.offline += 1;
      else row.online += 1;
      if (p.workStatus === WorkStatus.ONLINE && !p.orders.length) row.free += 1;
      if (p.workStatus === WorkStatus.BUSY || p.orders[0]?.status === OrderStatus.IN_PROCESS) row.busy += 1;
      if (p.workStatus === WorkStatus.ON_ROUTE || p.orders[0]?.status === OrderStatus.ACCEPTED || p.orders[0]?.status === OrderStatus.ON_WAY) row.onRoute += 1;
      byCity.set(city, row);
    }
    return {
      cities: [...byCity.values()],
      partners: partners.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        phone: p.user.phone,
        city: p.city,
        workStatus: p.workStatus,
        accountStatus: p.user.accountStatus,
        activeOrderId: p.orders[0]?.id || null,
        activeOrderStatus: p.orders[0]?.status || null,
      })),
    };
  }

  async recordStatus(partnerId: string, status: WorkStatus, opts: { orderId?: string; reason?: string } = {}) {
    const activeOrderId = opts.orderId || null;
    await this.prisma.$transaction([
      this.prisma.partnerProfile.update({
        where: { id: partnerId },
        data: { workStatus: status, isOnline: status !== WorkStatus.OFFLINE },
      }),
      this.prisma.partnerStatusEvent.create({
        data: {
          partnerId,
          status,
          orderId: activeOrderId,
          reason: opts.reason,
        },
      }),
      this.prisma.partnerAvailability.upsert({
        where: { partnerId },
        create: {
          partnerId,
          status,
          activeOrderId,
          etaFreeAt: estimateEtaFreeAt(status),
          lastSeenAt: new Date(),
        },
        update: {
          status,
          activeOrderId,
          etaFreeAt: estimateEtaFreeAt(status),
          lastSeenAt: new Date(),
        },
      }),
    ]);
  }

  async recordLocation(partnerId: string, lat: number, lng: number, opts: { orderId?: string; visibleToClient?: boolean } = {}) {
    await this.prisma.partnerLocation.create({
      data: {
        partnerId,
        orderId: opts.orderId,
        lat,
        lng,
        visibleToClient: Boolean(opts.visibleToClient && opts.orderId),
      },
    });
  }
}
