import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DisposalEventType,
  MovementState,
  OrderActorRole,
  OrderCategory,
  OrderStatus,
  SepticStage,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import {
  CLIENT_GEOFENCE_RADIUS_M,
  detectMovement,
  estimateEtaMinutes,
  haversineKm,
  inGeofenceZone,
  nextSepticState,
} from '../common/geofence.util';
import { MAP_STATUS_LABELS } from '../common/schedule.util';
import { OrderLifecycleService } from '../orders/order-lifecycle.service';
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
    private lifecycle: OrderLifecycleService,
  ) {}

  async ingestGps(userId: string, dto: GpsPointDto) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { trip: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');
    if (order.assignedPartnerId !== profile.id) throw new ForbiddenException('Заказ не назначен вам');
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

    const atClient = inGeofenceZone(dto.lat, dto.lng, {
      lat: order.clientLat,
      lng: order.clientLng,
      radiusM: CLIENT_GEOFENCE_RADIUS_M,
    });
    const disposalZone = this.geofence.findOfficialDisposalAt(dto.lat, dto.lng, officialDisposals);
    const clientDwellSec = trip.clientEnteredAt
      ? (now.getTime() - new Date(trip.clientEnteredAt).getTime()) / 1000
      : 0;
    const disposalDwellSec = trip.disposalEnteredAt
      ? (now.getTime() - new Date(trip.disposalEnteredAt).getTime()) / 1000
      : 0;

    const transition = nextSepticState({
      status: order.status,
      septicStage: order.septicStage,
      movement,
      atClient,
      atDisposal: Boolean(disposalZone),
      clientDwellSec,
      disposalDwellSec,
    });

    // Trip-метки времени по конкретным переходам под-статуса
    if (transition?.septicStage === SepticStage.ARRIVED) {
      tripUpdate.clientEnteredAt = trip.clientEnteredAt ?? now;
      tripUpdate.clientDwellStartedAt = trip.clientDwellStartedAt ?? now;
    }
    if (transition?.septicStage === SepticStage.LOADED) {
      tripUpdate.clientLeftAt = now;
    }
    if (transition?.septicStage === SepticStage.DISPOSAL_ARRIVED) {
      tripUpdate.disposalEnteredAt = trip.disposalEnteredAt ?? now;
      tripUpdate.disposalDwellStartedAt = trip.disposalDwellStartedAt ?? now;
    }
    if (
      transition?.septicStage === SepticStage.DISPOSAL_COMPLETED &&
      order.septicStage === SepticStage.DISPOSAL_ARRIVED &&
      disposalZone
    ) {
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
    if (transition?.status === OrderStatus.COMPLETED) {
      tripUpdate.disposalLeftAt = now;
      tripUpdate.endedAt = now;
    }

    // Незаконный слив: гружёный (LOADED), вне официальной зоны, остановился
    if (
      order.status === OrderStatus.IN_PROCESS &&
      order.septicStage === SepticStage.LOADED &&
      !disposalZone &&
      movement === MovementState.STOPPED
    ) {
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

    await this.prisma.trip.update({ where: { id: trip.id }, data: tripUpdate });

    const distanceKm = haversineKm(order.clientLat, order.clientLng, dto.lat, dto.lng);

    // Постоянные (не статусные) поля заказа на каждый пинг
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        executorLat: dto.lat,
        executorLng: dto.lng,
        etaMinutes: estimateEtaMinutes(distanceKm),
      },
    });

    // Применяем переход статуса/под-статуса через единый lifecycle
    if (transition) {
      if (transition.status !== order.status) {
        await this.lifecycle.transition({
          orderId: order.id,
          to: transition.status,
          role: OrderActorRole.system,
          septicStage: transition.septicStage,
          executorLat: dto.lat,
          executorLng: dto.lng,
        });
      } else if (transition.septicStage !== order.septicStage) {
        await this.lifecycle.updateSepticStage(order.id, transition.septicStage!);
      }
    }

    const current = await this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true },
    });
    await this.prisma.geoUpdate.create({
      data: {
        orderId: order.id,
        partnerId: profile.id,
        lat: dto.lat,
        lng: dto.lng,
        status: current.status,
      },
    });

    const payload = await this.buildTrackingPayload(order.id);
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
      septicStage: order.septicStage,
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
              in: [OrderStatus.ACCEPTED, OrderStatus.ON_WAY, OrderStatus.IN_PROCESS],
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
