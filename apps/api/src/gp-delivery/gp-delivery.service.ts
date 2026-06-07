import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryOfferStatus,
  DeliveryOrderStatus,
  DeliveryPartnerStatus,
  PartnerDirection,
  PartnerStatus,
  PartnerType,
  Prisma,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function toDate(value?: string | Date | null) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toDecimal(value: unknown) {
  if (value == null || value === '') return undefined;
  return new Prisma.Decimal(String(value));
}

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toFloat(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function cityIdFrom(body: any) {
  return body?.cityId?.trim?.() || 'city-uralsk';
}

@Injectable()
export class GpDeliveryService {
  constructor(private prisma: PrismaService) {}

  private async clientProfile(user: User) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ForbiddenException('CLIENT_PROFILE_REQUIRED');
    return profile;
  }

  private async partnerProfile(user: User) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new ForbiddenException('PARTNER_PROFILE_REQUIRED');
    return profile;
  }

  private async approvedDeliveryPartner(user: User) {
    const partner = await this.partnerProfile(user);
    if (partner.partnerType !== PartnerType.DELIVERY) throw new ForbiddenException('DELIVERY_PARTNER_REQUIRED');
    const delivery = await this.prisma.deliveryPartner.findUnique({ where: { partnerId: partner.id } });
    if (!delivery || delivery.status !== DeliveryPartnerStatus.APPROVED) {
      throw new ForbiddenException('DELIVERY_PARTNER_NOT_APPROVED');
    }
    return { partner, delivery };
  }

  async apply(user: User, body: any) {
    const partner = await this.partnerProfile(user);
    const cityId = cityIdFrom(body);
    const city = body?.city?.trim?.() || 'Уральск';
    return this.prisma.$transaction(async (tx) => {
      const updatedPartner = await tx.partnerProfile.update({
        where: { id: partner.id },
        data: {
          partnerType: PartnerType.DELIVERY,
          status: PartnerStatus.PENDING_REVIEW,
          directions: [PartnerDirection.DELIVERY],
          city,
          companyName: body?.companyName || body?.name || partner.companyName,
          bin: body?.bin || partner.bin,
          address: body?.address || partner.address,
        },
      });
      const delivery = await tx.deliveryPartner.upsert({
        where: { partnerId: partner.id },
        create: {
          partnerId: partner.id,
          cityId,
          city,
          direction: body?.direction,
          transportType: body?.transportType || 'Газель',
          bodyVolumeM3: toFloat(body?.bodyVolumeM3),
          capacityKg: body?.capacityKg ? toInt(body.capacityKg) : undefined,
          freePlaces: toInt(body?.freePlaces),
          basePrice: toDecimal(body?.basePrice),
          availableDates: Array.isArray(body?.availableDates) ? body.availableDates : [],
          status: DeliveryPartnerStatus.PENDING,
        },
        update: {
          cityId,
          city,
          direction: body?.direction,
          transportType: body?.transportType || 'Газель',
          bodyVolumeM3: toFloat(body?.bodyVolumeM3),
          capacityKg: body?.capacityKg ? toInt(body.capacityKg) : undefined,
          freePlaces: toInt(body?.freePlaces),
          basePrice: toDecimal(body?.basePrice),
          availableDates: Array.isArray(body?.availableDates) ? body.availableDates : [],
          status: DeliveryPartnerStatus.PENDING,
        },
      });
      return { partner: updatedPartner, delivery };
    });
  }

  async me(user: User) {
    const partner = await this.partnerProfile(user);
    return this.prisma.deliveryPartner.findUnique({
      where: { partnerId: partner.id },
      include: { routes: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async createRoute(user: User, body: any) {
    const { partner, delivery } = await this.approvedDeliveryPartner(user);
    return this.prisma.deliveryRoute.create({
      data: {
        deliveryPartnerId: delivery.id,
        partnerId: partner.id,
        cityId: delivery.cityId,
        fromCity: body?.fromCity,
        toCity: body?.toCity,
        transportType: body?.transportType || delivery.transportType,
        price: toDecimal(body?.price),
        availableDate: toDate(body?.availableDate),
      },
    });
  }

  async publicRoutes(query: any = {}) {
    return this.prisma.deliveryRoute.findMany({
      where: {
        isActive: true,
        deliveryPartner: { status: DeliveryPartnerStatus.APPROVED },
        ...(query.fromCity ? { fromCity: query.fromCity } : {}),
        ...(query.toCity ? { toCity: query.toCity } : {}),
      },
      include: { deliveryPartner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(user: User, body: any) {
    const client = await this.clientProfile(user);
    return this.prisma.deliveryOrder.create({
      data: {
        clientId: client.id,
        requesterPartnerId: body?.requesterPartnerId,
        cityId: cityIdFrom(body),
        fromCity: body?.fromCity,
        toCity: body?.toCity,
        pickupAddress: body?.pickupAddress,
        deliveryAddress: body?.deliveryAddress,
        cargoType: body?.cargoType || 'plants',
        cargoDescription: body?.cargoDescription,
        weightKg: body?.weightKg ? toInt(body.weightKg) : undefined,
        volumeM3: toFloat(body?.volumeM3),
        desiredDate: toDate(body?.desiredDate),
        linkedNurseryRequestId: body?.linkedNurseryRequestId,
      },
      include: { offers: true },
    });
  }

  async myOrders(user: User) {
    const client = await this.clientProfile(user);
    return this.prisma.deliveryOrder.findMany({
      where: { clientId: client.id },
      include: { offers: { include: { deliveryPartner: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async orderFeed(user: User) {
    const { delivery } = await this.approvedDeliveryPartner(user);
    return this.prisma.deliveryOrder.findMany({
      where: {
        status: { in: [DeliveryOrderStatus.CREATED, DeliveryOrderStatus.OFFERED] },
        OR: [{ fromCity: delivery.city }, { toCity: delivery.city }, { cityId: delivery.cityId }],
      },
      include: { offers: { where: { deliveryPartnerId: delivery.id } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOffer(user: User, orderId: string, body: any) {
    const { partner, delivery } = await this.approvedDeliveryPartner(user);
    const order = await this.prisma.deliveryOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('DELIVERY_ORDER_NOT_FOUND');
    const offer = await this.prisma.deliveryOffer.upsert({
      where: { deliveryOrderId_deliveryPartnerId: { deliveryOrderId: orderId, deliveryPartnerId: delivery.id } },
      create: {
        deliveryOrderId: orderId,
        deliveryPartnerId: delivery.id,
        partnerId: partner.id,
        cityId: delivery.cityId,
        price: toDecimal(body?.price) ?? new Prisma.Decimal(0),
        pickupDate: toDate(body?.pickupDate),
        etaDate: toDate(body?.etaDate),
        comment: body?.comment,
      },
      update: {
        price: toDecimal(body?.price) ?? new Prisma.Decimal(0),
        pickupDate: toDate(body?.pickupDate),
        etaDate: toDate(body?.etaDate),
        comment: body?.comment,
        status: DeliveryOfferStatus.SENT,
      },
    });
    await this.prisma.deliveryOrder.update({
      where: { id: orderId },
      data: { status: DeliveryOrderStatus.OFFERED },
    });
    return offer;
  }

  async acceptOffer(user: User, offerId: string) {
    const client = await this.clientProfile(user);
    const offer = await this.prisma.deliveryOffer.findUnique({ where: { id: offerId }, include: { deliveryOrder: true } });
    if (!offer || offer.deliveryOrder.clientId !== client.id) throw new NotFoundException('DELIVERY_OFFER_NOT_FOUND');
    return this.prisma.$transaction(async (tx) => {
      await tx.deliveryOffer.updateMany({
        where: { deliveryOrderId: offer.deliveryOrderId, id: { not: offer.id } },
        data: { status: DeliveryOfferStatus.REJECTED },
      });
      const accepted = await tx.deliveryOffer.update({
        where: { id: offer.id },
        data: { status: DeliveryOfferStatus.ACCEPTED },
      });
      await tx.deliveryOrder.update({
        where: { id: offer.deliveryOrderId },
        data: { status: DeliveryOrderStatus.ACCEPTED, acceptedOfferId: offer.id },
      });
      return accepted;
    });
  }

  adminPartners(status?: DeliveryPartnerStatus) {
    return this.prisma.deliveryPartner.findMany({
      where: status ? { status } : {},
      include: { partner: { include: { user: true } }, routes: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminSetPartnerStatus(id: string, status: DeliveryPartnerStatus) {
    const delivery = await this.prisma.deliveryPartner.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundException('DELIVERY_PARTNER_NOT_FOUND');
    const partnerStatus = status === DeliveryPartnerStatus.APPROVED
      ? PartnerStatus.APPROVED
      : status === DeliveryPartnerStatus.REJECTED
        ? PartnerStatus.REJECTED
        : PartnerStatus.SUSPENDED;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryPartner.update({ where: { id }, data: { status } });
      await tx.partnerProfile.update({
        where: { id: delivery.partnerId },
        data: { status: partnerStatus, partnerType: PartnerType.DELIVERY, directions: [PartnerDirection.DELIVERY] },
      });
      return updated;
    });
  }

  adminOrders() {
    return this.prisma.deliveryOrder.findMany({
      include: {
        client: { include: { user: true } },
        offers: { include: { deliveryPartner: true } },
        linkedNurseryRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
