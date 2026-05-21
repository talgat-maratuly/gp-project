import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { GpsTrackingService } from './gps-tracking.service';

@Injectable()
export class GeoService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
    private tracking: GpsTrackingService,
  ) {}

  async updatePartnerLocation(userId: string, lat: number, lng: number, orderId?: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    await this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data: { lat, lng },
    });
    if (orderId) {
      return this.tracking.ingestGps(userId, { orderId, lat, lng });
    }
    return { lat, lng };
  }

  async getOrderTracking(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true, partner: true },
    });
    if (!order) throw new NotFoundException('Заказ не найден');

    const isClient = order.client.userId === userId;
    const isPartner = order.partner?.userId === userId;
    if (role !== 'ADMIN' && !isClient && !isPartner) {
      throw new ForbiddenException();
    }

    return this.tracking.buildTrackingPayload(orderId);
  }

  async mockMove(userId: string, orderId: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    const lat = (profile.lat ?? 51.243) + (Math.random() - 0.5) * 0.008;
    const lng = (profile.lng ?? 51.377) + (Math.random() - 0.5) * 0.008;
    return this.tracking.ingestGps(userId, {
      orderId,
      lat,
      lng,
      speedKmh: 25 + Math.random() * 15,
      heading: Math.random() * 360,
    });
  }
}
