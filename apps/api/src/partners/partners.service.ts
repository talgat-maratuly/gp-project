import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isKnownSubserviceId, SUBSERVICE_TO_DIRECTION } from '../common/partner-offerings.util';
import { FurnitureExecutorService } from '../furniture-executor/furniture-executor.service';

const PartnerOfferingStatusValue = {
  ACTIVE: 'ACTIVE',
  PENDING_MODERATION: 'PENDING_MODERATION',
  REJECTED: 'REJECTED',
} as const;

@Injectable()
export class PartnersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => FurnitureExecutorService))
    private furnitureExecutor: FurnitureExecutorService,
  ) {}

  /**
   * Направления в профиле = объединение направлений всех подуслуг, кроме отклонённых.
   */
  async syncServiceAccessFromOfferings(partnerId: string) {
    return this.furnitureExecutor.syncServiceAccessFromOfferings(partnerId);
  }

  async syncDirectionsFromOfferings(partnerId: string) {
    const offerings = await this.prisma.partnerServiceOffering.findMany({ where: { partnerId } });
    const dirs = new Set<(typeof SUBSERVICE_TO_DIRECTION)[keyof typeof SUBSERVICE_TO_DIRECTION]>();
    for (const o of offerings) {
      if (o.status === PartnerOfferingStatusValue.REJECTED) continue;
      const d = SUBSERVICE_TO_DIRECTION[o.subserviceId];
      if (d) dirs.add(d);
    }
    await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data: { directions: [...dirs] },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        serviceOfferings: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!profile) throw new NotFoundException('Профиль партнёра не найден');
    return profile;
  }

  async updateProfile(
    userId: string,
    data: {
      company?: string;
      isOnline?: boolean;
      lat?: number;
      lng?: number;
    },
  ) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Профиль партнёра не найден');
    return this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  async ensurePartnerProfile(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('Только для партнёров');
    return profile;
  }

  /** Множество subserviceId со статусом ACTIVE (для фильтрации заказов). */
  async getActiveSubserviceIdsForPartnerProfile(partnerProfileId: string): Promise<Set<string>> {
    const rows = await this.prisma.partnerServiceOffering.findMany({
      where: { partnerId: partnerProfileId, status: PartnerOfferingStatusValue.ACTIVE },
      select: { subserviceId: true },
    });
    return new Set(rows.map((r) => r.subserviceId));
  }

  validateSubserviceIds(raw: string[]): string[] {
    const ids = [...new Set(raw.map((s) => s.trim()).filter(Boolean))];
    if (!ids.length) throw new BadRequestException('Укажите хотя бы одну подуслугу');
    for (const id of ids) {
      if (!isKnownSubserviceId(id)) {
        throw new BadRequestException(`Неизвестная подуслуга: ${id}`);
      }
    }
    return ids;
  }

  async addOfferings(userId: string, subserviceIds: string[]) {
    const ids = this.validateSubserviceIds(subserviceIds);
    const profile = await this.ensurePartnerProfile(userId);

    const existing = await this.prisma.partnerServiceOffering.findMany({
      where: { partnerId: profile.id, subserviceId: { in: ids } },
      select: { subserviceId: true, status: true },
    });
    const existingMap = new Map(existing.map((e) => [e.subserviceId, e.status]));

    const toCreate = ids
      .filter((sid) => !existingMap.get(sid))
      .map((sid) => ({
        partnerId: profile.id,
        subserviceId: sid,
        status: PartnerOfferingStatusValue.PENDING_MODERATION,
      }));

    if (toCreate.length) {
      await this.prisma.partnerServiceOffering.createMany({ data: toCreate });
    }

    await this.syncDirectionsFromOfferings(profile.id);
    await this.furnitureExecutor.syncServiceAccessFromOfferings(profile.id);
    return this.getProfile(userId);
  }
}
