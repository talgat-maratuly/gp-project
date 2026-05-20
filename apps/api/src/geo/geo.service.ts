import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { haversineKm, MAP_STATUS_LABELS } from '../common/schedule.util';

@Injectable()
export class GeoService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  async updatePartnerLocation(userId: string, lat: number, lng: number, orderId?: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    await this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data: { lat, lng },
    });
    if (orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.partnerId !== profile.id) {
        throw new ForbiddenException('Заказ не назначен вам');
      }
      await this.prisma.order.update({
        where: { id: orderId },
        data: { executorLat: lat, executorLng: lng },
      });
      await this.prisma.geoUpdate.create({
        data: {
          orderId,
          partnerId: profile.id,
          lat,
          lng,
          status: order.status,
        },
      });
    }
    return { lat, lng };
  }

  async getOrderTracking(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        partner: true,
        geoUpdates: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!order) throw new NotFoundException('Заказ не найден');

    const isClient = order.client.userId === userId;
    const isPartner = order.partner?.userId === userId;
    if (role !== 'ADMIN' && !isClient && !isPartner) {
      throw new ForbiddenException();
    }

    const exLat = order.executorLat ?? order.partner?.lat;
    const exLng = order.executorLng ?? order.partner?.lng;
    const distanceKm =
      exLat != null && exLng != null
        ? haversineKm(order.clientLat, order.clientLng, exLat, exLng)
        : null;

    return {
      orderId: order.id,
      status: order.status,
      statusLabel: MAP_STATUS_LABELS[order.status] || order.status,
      client: { lat: order.clientLat, lng: order.clientLng },
      executor: { lat: exLat, lng: exLng },
      distanceKm,
      timeline: order.geoUpdates,
      labels: MAP_STATUS_LABELS,
    };
  }

  async mockMove(userId: string, orderId: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    const lat = (profile.lat ?? 51.243) + (Math.random() - 0.5) * 0.01;
    const lng = (profile.lng ?? 51.377) + (Math.random() - 0.5) * 0.01;
    return this.updatePartnerLocation(userId, lat, lng, orderId);
  }
}
