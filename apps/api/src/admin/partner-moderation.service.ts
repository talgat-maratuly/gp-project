import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  PartnerModerationAction,
  PartnerOfferingStatus,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  Role,
  User,
} from '@prisma/client';
import { RegionAccessService } from '../common/region-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class PartnerModerationAdminService {
  constructor(
    private prisma: PrismaService,
    private regionAccess: RegionAccessService,
    private partners: PartnersService,
  ) {}

  private regionFilter(admin: User) {
    return this.regionAccess.regionWhere(admin);
  }

  private roleScopeWhere(scope?: 'specialist' | 'shop', partnerRole?: PartnerRole) {
    if (partnerRole) return { partnerRole };
    if (scope === 'specialist') {
      return {
        OR: [
          { partnerRole: { in: [PartnerRole.SPECIALIST, PartnerRole.MIXED_PARTNER] } },
          {
            partnerRole: null,
            OR: [
              { partnerType: { not: PartnerType.SHOP } },
              { partnerType: null },
            ],
          },
        ],
      };
    }
    if (scope === 'shop') {
      return {
        OR: [
          { partnerRole: { in: [PartnerRole.SHOP, PartnerRole.MIXED_PARTNER] } },
          { partnerType: PartnerType.SHOP },
        ],
      };
    }
    return {};
  }

  list(
    admin: User,
    opts?: {
      status?: PartnerStatus;
      scope?: 'specialist' | 'shop';
      partnerRole?: PartnerRole;
      regionId?: string;
      q?: string;
      city?: string;
    },
  ) {
    const search = opts?.q?.trim();
    return this.prisma.partnerProfile.findMany({
      where: {
        ...this.regionFilter(admin),
        ...this.roleScopeWhere(opts?.scope, opts?.partnerRole),
        ...(opts?.status ? { status: opts.status } : {}),
        ...(opts?.regionId ? { regionId: opts.regionId } : {}),
        ...(opts?.city
          ? { city: { contains: opts.city.trim(), mode: 'insensitive' as const } }
          : {}),
        ...(search
          ? {
              OR: [
                { companyName: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } },
        region: { select: { id: true, name: true, code: true } },
        serviceOfferings: true,
        _count: { select: { moderationAudit: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOne(admin: User, partnerId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { id: partnerId },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, regionId: true } },
        region: { select: { id: true, name: true, code: true } },
        serviceOfferings: { orderBy: { createdAt: 'asc' } },
        moderationAudit: {
          orderBy: { createdAt: 'desc' },
          include: { admin: { select: { id: true, name: true, email: true } } },
        },
        approvedByAdmin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!profile) throw new NotFoundException('Партнёр не найден');
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);
    return profile;
  }

  private async assertModeratable(partnerId: string, allowed: PartnerStatus[]) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { id: partnerId } });
    if (!profile) throw new NotFoundException('Партнёр не найден');
    if (!allowed.includes(profile.status)) {
      throw new BadRequestException(`Действие недоступно для статуса ${profile.status}`);
    }
    return profile;
  }

  private async writeAudit(
    partnerId: string,
    adminId: string,
    action: PartnerModerationAction,
    opts?: { reason?: string; comment?: string },
  ) {
    return this.prisma.partnerModerationAuditLog.create({
      data: {
        partnerId,
        adminUserId: adminId,
        action,
        reason: opts?.reason,
        comment: opts?.comment,
      },
    });
  }

  async approve(admin: User, partnerId: string) {
    const profile = await this.assertModeratable(partnerId, [
      PartnerStatus.PENDING_REVIEW,
      PartnerStatus.SUSPENDED,
      PartnerStatus.REJECTED,
    ]);
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerProfile.update({
        where: { id: partnerId },
        data: {
          status: PartnerStatus.APPROVED,
          approvedByAdminId: admin.id,
          approvedAt: new Date(),
          rejectionReason: null,
          revisionComment: null,
          rejectedAt: null,
          suspendedAt: null,
        },
      });
      await tx.partnerServiceOffering.updateMany({
        where: { partnerId },
        data: { status: PartnerOfferingStatus.ACTIVE, moderationNote: null },
      });
      await this.writeAudit(partnerId, admin.id, PartnerModerationAction.APPROVE);
    });

    await this.partners.syncDirectionsFromOfferings(partnerId);
    await this.partners.syncServiceAccessFromOfferings(partnerId);
    return this.getOne(admin, partnerId);
  }

  async reject(admin: User, partnerId: string, reason: string) {
    const profile = await this.assertModeratable(partnerId, [PartnerStatus.PENDING_REVIEW]);
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerProfile.update({
        where: { id: partnerId },
        data: {
          status: PartnerStatus.REJECTED,
          rejectionReason: reason.trim(),
          rejectedAt: new Date(),
        },
      });
      await tx.partnerServiceOffering.updateMany({
        where: { partnerId },
        data: { status: PartnerOfferingStatus.REJECTED },
      });
      await this.writeAudit(partnerId, admin.id, PartnerModerationAction.REJECT, { reason });
    });
    return this.getOne(admin, partnerId);
  }

  async revision(admin: User, partnerId: string, comment: string) {
    const profile = await this.assertModeratable(partnerId, [PartnerStatus.PENDING_REVIEW]);
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerProfile.update({
        where: { id: partnerId },
        data: {
          status: PartnerStatus.NEEDS_REVISION,
          revisionComment: comment.trim(),
        },
      });
      await this.writeAudit(partnerId, admin.id, PartnerModerationAction.REVISION, { comment });
    });
    return this.getOne(admin, partnerId);
  }

  async suspend(admin: User, partnerId: string, reason?: string) {
    const profile = await this.assertModeratable(partnerId, [PartnerStatus.APPROVED]);
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);

    await this.prisma.$transaction(async (tx) => {
      await tx.partnerProfile.update({
        where: { id: partnerId },
        data: {
          status: PartnerStatus.SUSPENDED,
          suspendedAt: new Date(),
          isOnline: false,
        },
      });
      await tx.partnerServiceOffering.updateMany({
        where: { partnerId },
        data: { status: PartnerOfferingStatus.TEMPORARILY_BLOCKED },
      });
      await this.writeAudit(partnerId, admin.id, PartnerModerationAction.SUSPEND, { reason });
    });
    return this.getOne(admin, partnerId);
  }

  async restore(admin: User, partnerId: string) {
    const profile = await this.assertModeratable(partnerId, [
      PartnerStatus.SUSPENDED,
      PartnerStatus.REJECTED,
    ]);
    if (profile.regionId) this.regionAccess.assertCanAccessRegion(admin, profile.regionId);
    return this.approve(admin, partnerId);
  }

  async approveStore(admin: User, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Магазин не найден');
    this.regionAccess.assertCanAccessRegion(admin, store.regionId);
    if (store.status !== 'PENDING_REVIEW' && store.status !== 'NEEDS_REVISION') {
      throw new BadRequestException(`Нельзя подтвердить магазин в статусе ${store.status}`);
    }
    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: 'APPROVED' },
    });
  }
}
