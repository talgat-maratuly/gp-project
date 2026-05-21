import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DisposalEventType,
  MovementState,
  OrderCategory,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CLIENT_DWELL_SEC,
  CLIENT_GEOFENCE_RADIUS_M,
  DISPOSAL_DWELL_SEC,
  detectMovement,
  estimateEtaMinutes,
  haversineKm,
  inGeofenceZone,
  isSepticGpsManaged,
} from '../common/geofence.util';
import { MAP_STATUS_LABELS } from '../common/schedule.util';
import { GeofenceService } from './geofence.service';
import { GeoGateway } from './geo.gateway';
import { GpsPointDto } from './dto/gps-point.dto';

@Injectable()
export class GpsTrackingService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
    private geofence: GeofenceService,
    private gateway: GeoGateway,
    private notifications: NotificationsService,
  ) {}

  async ingestGps(userId: string, dto: GpsPointDto) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { trip: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.partnerId !== profile.id) throw new ForbiddenException('Заказ не назначен вам');
    if (order.category !== OrderCategory.SEPTIC) {
      return this.ingestSimpleGps(profile.id, order, dto);
    }

    const movement = detectMovement(
      order.trip?.lastLat ?? null,
      order.trip?.lastLng ?? null,
      dto.lat,
      dto.lng,
      dto.speedKmh,
    );

    let trip = order.trip;
    if (!trip && order.status === OrderStatus.ACCEPTED) {
      trip = await this.prisma.trip.create({
        data: { orderId: order.id, partnerId: profile.id },
      });
    }
    if (!trip) throw new BadRequestException('Рейс не начат — примите заказ');

    await this.prisma.gpsPoint.create({
      data: {
        tripId: trip.id,
        orderId: order.id,
        partnerId: profile.id,
        lat: dto.lat,
        lng: dto.lng,
        speedKmh: dto.speedKmh,
        heading: dto.heading,
        movement,
      },
    });

    await this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data: { lat: dto.lat, lng: dto.lng },
    });

    const zones = await this.geofence.listActive();
    const officialDisposals = await this.geofence.listOfficialDisposals();
    const now = new Date();

    const tripUpdate: Record<string, unknown> = {
      lastLat: dto.lat,
      lastLng: dto.lng,
      lastSpeedKmh: dto.speedKmh,
      lastHeading: dto.heading,
      lastMovement: movement,
      lastPointAt: now,
    };

    let newStatus = order.status;
    const atClient = inGeofenceZone(dto.lat, dto.lng, {
      lat: order.clientLat,
      lng: order.clientLng,
      radiusM: CLIENT_GEOFENCE_RADIUS_M,
    });
    const disposalZone = this.geofence.findOfficialDisposalAt(dto.lat, dto.lng, officialDisposals);
    const anyZone = this.geofence.findZoneAt(dto.lat, dto.lng, zones);

    // ACCEPTED → ON_THE_WAY when moving
    if (order.status === OrderStatus.ACCEPTED && movement === MovementState.MOVING) {
      newStatus = OrderStatus.ON_THE_WAY;
    }

    // ON_THE_WAY → ARRIVED at client
    if (order.status === OrderStatus.ON_THE_WAY && atClient) {
      newStatus = OrderStatus.ARRIVED;
      tripUpdate.clientEnteredAt = trip.clientEnteredAt ?? now;
    }

    // ARRIVED → STARTED after dwell 3 min
    if (order.status === OrderStatus.ARRIVED && atClient) {
      const entered = trip.clientEnteredAt ?? now;
      if (!trip.clientDwellStartedAt) tripUpdate.clientDwellStartedAt = entered;
      const dwellSec = (now.getTime() - new Date(entered).getTime()) / 1000;
      if (dwellSec >= CLIENT_DWELL_SEC) {
        newStatus = OrderStatus.STARTED;
      }
    }

    // STARTED → LOADED when left client zone
    if (order.status === OrderStatus.STARTED && !atClient) {
      newStatus = OrderStatus.LOADED;
      tripUpdate.clientLeftAt = now;
    }

    // LOADED → DISPOSAL_ARRIVED at official disposal
    if (order.status === OrderStatus.LOADED && disposalZone) {
      newStatus = OrderStatus.DISPOSAL_ARRIVED;
      tripUpdate.disposalEnteredAt = trip.disposalEnteredAt ?? now;
    }

    // Illegal disposal while LOADED (unload outside official zone)
    if (order.status === OrderStatus.LOADED && !disposalZone && movement === MovementState.STOPPED) {
      const recentIllegal = await this.prisma.disposalEvent.findFirst({
        where: { orderId: order.id, type: DisposalEventType.ILLEGAL },
        orderBy: { createdAt: 'desc' },
      });
      const since = recentIllegal ? (now.getTime() - recentIllegal.createdAt.getTime()) / 1000 : 999;
      if (since > 60) {
        await this.prisma.disposalEvent.create({
          data: {
            tripId: trip.id,
            orderId: order.id,
            lat: dto.lat,
            lng: dto.lng,
            type: DisposalEventType.ILLEGAL,
            isOfficial: false,
            note: 'Выгрузка вне официального слива',
          },
        });
        await this.prisma.order.update({
          where: { id: order.id },
          data: { illegalDisposal: true },
        });
        this.gateway.emitFleetUpdate({
          type: 'illegal_disposal',
          orderId: order.id,
          lat: dto.lat,
          lng: dto.lng,
        });
      }
    }

    // DISPOSAL_ARRIVED → DISPOSAL_COMPLETED after 2 min dwell
    if (order.status === OrderStatus.DISPOSAL_ARRIVED && disposalZone) {
      const entered = trip.disposalEnteredAt ?? now;
      if (!trip.disposalDwellStartedAt) tripUpdate.disposalDwellStartedAt = entered;
      const dwellSec = (now.getTime() - new Date(entered).getTime()) / 1000;
      if (dwellSec >= DISPOSAL_DWELL_SEC) {
        newStatus = OrderStatus.DISPOSAL_COMPLETED;
        await this.prisma.disposalEvent.create({
          data: {
            tripId: trip.id,
            orderId: order.id,
            zoneId: disposalZone.id,
            lat: dto.lat,
            lng: dto.lng,
            type: DisposalEventType.LEGAL,
            isOfficial: true,
            note: disposalZone.name,
          },
        });
      }
    }

    // DISPOSAL_COMPLETED → COMPLETED when left disposal
    if (order.status === OrderStatus.DISPOSAL_COMPLETED && !disposalZone) {
      newStatus = OrderStatus.COMPLETED;
      tripUpdate.disposalLeftAt = now;
      tripUpdate.endedAt = now;
    }

    await this.prisma.trip.update({ where: { id: trip.id }, data: tripUpdate });

    const orderData: Record<string, unknown> = {
      executorLat: dto.lat,
      executorLng: dto.lng,
    };

    const distanceKm = haversineKm(order.clientLat, order.clientLng, dto.lat, dto.lng);
    orderData.etaMinutes = estimateEtaMinutes(distanceKm);

    if (newStatus !== order.status) {
      orderData.status = newStatus;
      if (newStatus === OrderStatus.COMPLETED) orderData.completedAt = now;
      await this.notifications.notifyOrderStatusChange(order.id, newStatus);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: orderData,
    });

    await this.prisma.geoUpdate.create({
      data: {
        orderId: order.id,
        partnerId: profile.id,
        lat: dto.lat,
        lng: dto.lng,
        status: updated.status,
      },
    });

    const payload = await this.buildTrackingPayload(updated.id);
    this.gateway.emitOrderTracking(order.id, payload);
    this.gateway.emitFleetUpdate({ type: 'gps', ...payload });

    return payload;
  }

  private async ingestSimpleGps(
    partnerId: string,
    order: { id: string; status: OrderStatus; clientLat: number; clientLng: number },
    dto: GpsPointDto,
  ) {
    await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data: { lat: dto.lat, lng: dto.lng },
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { executorLat: dto.lat, executorLng: dto.lng },
    });
    await this.prisma.gpsPoint.create({
      data: {
        orderId: order.id,
        partnerId,
        lat: dto.lat,
        lng: dto.lng,
        speedKmh: dto.speedKmh,
        heading: dto.heading,
        movement: detectMovement(null, null, dto.lat, dto.lng, dto.speedKmh),
      },
    });
    return this.buildTrackingPayload(order.id);
  }

  async buildTrackingPayload(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        trip: true,
        partner: true,
        gpsPoints: { orderBy: { recordedAt: 'desc' }, take: 30 },
        disposalEvents: { orderBy: { createdAt: 'desc' }, take: 5, include: { zone: true } },
      },
    });
    if (!order) throw new NotFoundException();

    const zones = await this.geofence.listOfficialDisposals();
    const exLat = order.executorLat ?? order.partner?.lat;
    const exLng = order.executorLng ?? order.partner?.lng;
    const distanceKm =
      exLat != null && exLng != null
        ? haversineKm(order.clientLat, order.clientLng, exLat, exLng)
        : null;

    const route = [...order.gpsPoints]
      .reverse()
      .map((p) => [p.lat, p.lng] as [number, number]);

    return {
      orderId: order.id,
      status: order.status,
      statusLabel: MAP_STATUS_LABELS[order.status] || order.status,
      illegalDisposal: order.illegalDisposal,
      client: { lat: order.clientLat, lng: order.clientLng },
      executor: {
        lat: exLat,
        lng: exLng,
        speedKmh: order.trip?.lastSpeedKmh,
        heading: order.trip?.lastHeading,
        movement: order.trip?.lastMovement,
      },
      distanceKm,
      etaMinutes: order.etaMinutes ?? (distanceKm != null ? estimateEtaMinutes(distanceKm) : null),
      geofences: zones.map((z) => ({
        id: z.id,
        name: z.name,
        type: z.type,
        lat: z.lat,
        lng: z.lng,
        radiusM: z.radiusM,
        isOfficial: z.isOfficial,
      })),
      route,
      disposalEvents: order.disposalEvents,
      timeline: order.gpsPoints,
      gpsAuto: order.category === OrderCategory.SEPTIC,
    };
  }

  async getFleetSnapshot() {
    const partners = await this.prisma.partnerProfile.findMany({
      where: { isOnline: true },
      include: {
        user: { select: { name: true, phone: true } },
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.ACCEPTED,
                OrderStatus.ON_THE_WAY,
                OrderStatus.ARRIVED,
                OrderStatus.STARTED,
                OrderStatus.LOADED,
                OrderStatus.DISPOSAL_ARRIVED,
                OrderStatus.DISPOSAL_COMPLETED,
              ],
            },
          },
          take: 1,
        },
      },
    });
    const zones = await this.geofence.listOfficialDisposals();
    const illegal = await this.prisma.disposalEvent.findMany({
      where: { type: DisposalEventType.ILLEGAL },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { id: true, serviceName: true } } },
    });
    return {
      vehicles: partners.map((p) => ({
        partnerId: p.id,
        name: p.user.name,
        company: p.company,
        lat: p.lat,
        lng: p.lng,
        activeOrderId: p.orders[0]?.id,
        activeOrderStatus: p.orders[0]?.status,
      })),
      geofences: zones,
      illegalDisposals: illegal,
    };
  }

  async getTripHistory(orderId: string) {
    return this.prisma.gpsPoint.findMany({
      where: { orderId },
      orderBy: { recordedAt: 'asc' },
      take: 500,
    });
  }
}
