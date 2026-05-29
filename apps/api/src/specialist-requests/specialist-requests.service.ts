import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderCategory,
  PartnerModerationAction,
  PartnerOfferingStatus,
  PartnerRole,
  PartnerStatus,
  PortalRole,
  Prisma,
  RequestStatus,
  User,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerModerationService } from '../partners/partner-moderation.service';
import { PartnerApplyDto } from '../partners/dto/partner-apply.dto';
import { RbacService } from '../rbac/rbac.service';
import { AccountStatusService } from '../user-status/account-status.service';
import { SpecialistModeratorAccessService } from './specialist-moderator-access.service';
import { SpecialistRequestNotificationsService } from './specialist-request-notifications.service';
import {
  assertCanResubmit,
  assertRequestStatusTransition,
} from './specialist-request.transitions';
import { ModeratorSpecialistRequestsQueryDto } from './dto/moderator-list-query.dto';
import { SUBSERVICE_TO_DIRECTION } from '../common/partner-offerings.util';

const specialistInclude = {
  user: { select: { id: true, email: true, name: true, phone: true, regionId: true } },
  region: { select: { id: true, name: true, code: true, isActive: true } },
  partnerProfile: {
    include: {
      serviceOfferings: { orderBy: { createdAt: 'asc' as const } },
      moderationAudit: {
        orderBy: { createdAt: 'desc' as const },
        take: 10,
        include: { admin: { select: { id: true, name: true, email: true } } },
      },
    },
  },
  moderator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SpecialistRequestInclude;

@Injectable()
export class SpecialistRequestsService {
  constructor(
    private prisma: PrismaService,
    private partnerModeration: PartnerModerationService,
    private moderatorAccess: SpecialistModeratorAccessService,
    private notifications: SpecialistRequestNotificationsService,
    private rbac: RbacService,
    private accountStatus: AccountStatusService,
  ) {}

  private mapToApi(request: Prisma.SpecialistRequestGetPayload<{ include: typeof specialistInclude }>) {
    const profile = request.partnerProfile;
    return {
      id: request.id,
      userId: request.userId,
      partnerProfileId: request.partnerProfileId,
      regionId: request.regionId,
      city: request.city,
      district: request.district,
      categoryId: request.primaryCategory,
      subCategoryId: request.primarySubserviceId,
      status: request.status,
      moderatorId: request.moderatorId,
      approvedAt: request.approvedAt,
      rejectionReason: request.rejectionReason,
      rejectedAt: request.rejectedAt,
      resubmittedAt: request.resubmittedAt,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      specialistName: profile.fullName ?? profile.companyName ?? request.user.name,
      phoneNumber: request.user.phone,
      partnerStatus: profile.status,
      offerings: profile.serviceOfferings,
      region: request.region,
      uiMessage: this.uiMessageForStatus(request.status),
    };
  }

  private uiMessageForStatus(status: RequestStatus): string | null {
    if (status === RequestStatus.PENDING) {
      return 'Your application is under moderation.\nPlease wait for review results.';
    }
    if (status === RequestStatus.REJECTED) {
      return 'Application Status: Rejected';
    }
    return null;
  }

  private categoryFromSubservice(subserviceId: string | undefined): OrderCategory | null {
    if (!subserviceId) return null;
    const dir = SUBSERVICE_TO_DIRECTION[subserviceId as keyof typeof SUBSERVICE_TO_DIRECTION];
    if (!dir) return null;
    return dir as OrderCategory;
  }

  async getMyRequest(userId: string) {
    const request = await this.prisma.specialistRequest.findUnique({
      where: { userId },
      include: specialistInclude,
    });
    if (!request) {
      const profile = await this.prisma.partnerProfile.findUnique({
        where: { userId },
        include: { user: true, region: true, serviceOfferings: true },
      });
      if (!profile) throw new NotFoundException('Специалист өтінімі жоқ');
      return {
        status: profile.requestStatus,
        partnerStatus: profile.status,
        rejectionReason: profile.rejectionReason,
        uiMessage: profile.requestStatus
          ? this.uiMessageForStatus(profile.requestStatus)
          : 'Өтінім әлі жіберілмеген',
        canEdit: profile.requestStatus === RequestStatus.REJECTED,
        canResubmit: profile.requestStatus === RequestStatus.REJECTED,
        profile,
      };
    }
    const mapped = this.mapToApi(request);
    return {
      ...mapped,
      canEdit: request.status === RequestStatus.REJECTED,
      canResubmit: request.status === RequestStatus.REJECTED,
      editButtonLabel: 'Edit Application',
    };
  }

  async submit(userId: string, dto: PartnerApplyDto & { district?: string }, isResubmit = false) {
    const existing = await this.prisma.specialistRequest.findUnique({ where: { userId } });
    if (existing?.status === RequestStatus.APPROVED) {
      throw new BadRequestException('Бекітілген өтінімді өзгертуге болмайды');
    }
    if (existing?.status === RequestStatus.PENDING && !isResubmit) {
      throw new BadRequestException('Бір уақытта тек бір PENDING өтінім болуы мүмкін');
    }
    if (isResubmit) {
      if (existing) {
        assertCanResubmit(existing.status);
      } else {
        const profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
        const rejected =
          profile?.requestStatus === RequestStatus.REJECTED ||
          profile?.status === PartnerStatus.REJECTED;
        if (!rejected) {
          throw new BadRequestException('Қайта жіберу үшін өтінім REJECTED болуы керек');
        }
      }
    }

    const profile = await this.partnerModeration.apply(userId, dto);
    const primarySub =
      dto.subserviceIds?.[0] ??
      profile.serviceOfferings?.[0]?.subserviceId ??
      undefined;

    const data = {
      regionId: profile.regionId!,
      city: profile.city,
      district: dto.district?.trim() || null,
      primarySubserviceId: primarySub ?? null,
      primaryCategory: this.categoryFromSubservice(primarySub),
      status: RequestStatus.PENDING,
      rejectionReason: null,
      rejectedAt: null,
      moderatorId: null,
      approvedAt: null,
      resubmittedAt: isResubmit ? new Date() : undefined,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        portalRoles: {
          set: [PortalRole.CLIENT],
        },
      },
    });

    const request = existing
      ? await this.prisma.specialistRequest.update({
          where: { id: existing.id },
          data,
          include: specialistInclude,
        })
      : await this.prisma.specialistRequest.create({
          data: {
            userId,
            partnerProfileId: profile.id,
            ...data,
          },
          include: specialistInclude,
        });

    await this.prisma.partnerProfile.update({
      where: { id: profile.id },
      data: {
        requestStatus: RequestStatus.PENDING,
        status: PartnerStatus.PENDING_REVIEW,
        workStatus: WorkStatus.OFFLINE,
        isOnline: false,
      },
    });

    await this.notifications.notifySubmitted(userId, request.regionId, isResubmit);
    return this.mapToApi(request);
  }

  async resubmit(userId: string, dto: PartnerApplyDto & { district?: string }) {
    return this.submit(userId, dto, true);
  }

  async listForModerator(actor: User, query: ModeratorSpecialistRequestsQueryDto) {
    this.moderatorAccess.assertCanModerate(actor);
    const scope = await this.moderatorAccess.buildListWhere(actor);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const partnerProfileWhere: Prisma.PartnerProfileWhereInput = {
      partnerRole: { in: [PartnerRole.SPECIALIST, PartnerRole.MIXED_PARTNER] },
      ...(query.specialistName
        ? {
            OR: [
              { fullName: { contains: query.specialistName, mode: 'insensitive' } },
              { companyName: { contains: query.specialistName, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const where: Prisma.SpecialistRequestWhereInput = {
      ...scope,
      ...(query.status ? { status: query.status } : {}),
      ...(query.city ? { city: { contains: query.city.trim(), mode: 'insensitive' } } : {}),
      ...(query.district ? { district: { contains: query.district.trim(), mode: 'insensitive' } } : {}),
      ...(query.category ? { primaryCategory: query.category } : {}),
      ...(query.subcategory ? { primarySubserviceId: query.subcategory } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.phoneNumber
        ? { user: { phone: { contains: query.phoneNumber.trim() } } }
        : {}),
      partnerProfile: partnerProfileWhere,
    };

    if (typeof scope.regionId === 'string') {
      const region = await this.prisma.region.findUnique({ where: { id: scope.regionId } });
      if (region && !region.isActive) {
        throw new BadRequestException('Аймақ белсенді емес');
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.specialistRequest.findMany({
        where,
        include: specialistInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.specialistRequest.count({ where }),
    ]);

    return {
      items: items.map((r) => this.mapToApi(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getForModerator(actor: User, requestId: string) {
    this.moderatorAccess.assertCanModerate(actor);
    const request = await this.prisma.specialistRequest.findUnique({
      where: { id: requestId },
      include: specialistInclude,
    });
    if (!request) throw new NotFoundException('Өтінім табылмады');
    await this.moderatorAccess.assertCanModerateRequest(actor, request.regionId);
    return this.mapToApi(request);
  }

  async approve(actor: User, requestId: string) {
    this.moderatorAccess.assertCanModerate(actor);
    const request = await this.prisma.specialistRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Өтінім табылмады');
    await this.moderatorAccess.assertCanModerateRequest(actor, request.regionId);
    assertRequestStatusTransition(request.status, RequestStatus.APPROVED);

    await this.prisma.$transaction(async (tx) => {
      await tx.specialistRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          moderatorId: actor.id,
          approvedAt: new Date(),
          rejectionReason: null,
          rejectedAt: null,
        },
      });
      await tx.partnerProfile.update({
        where: { id: request.partnerProfileId },
        data: {
          status: PartnerStatus.APPROVED,
          requestStatus: RequestStatus.APPROVED,
          approvedByAdminId: actor.id,
          approvedAt: new Date(),
          rejectionReason: null,
          rejectedAt: null,
        },
      });
      await tx.partnerServiceOffering.updateMany({
        where: { partnerId: request.partnerProfileId },
        data: { status: PartnerOfferingStatus.ACTIVE },
      });
      await tx.partnerModerationAuditLog.create({
        data: {
          partnerId: request.partnerProfileId,
          adminUserId: actor.id,
          action: PartnerModerationAction.APPROVE,
        },
      });
    });

    await this.rbac.onSpecialistApproved(request.userId);
    await this.accountStatus.systemEnsureActive(
      request.userId,
      'Specialist application approved',
    );
    await this.notifications.notifyApproved(request.userId);

    return this.getForModerator(actor, requestId);
  }

  async reject(actor: User, requestId: string, rejectionReason: string) {
    this.moderatorAccess.assertCanModerate(actor);
    const request = await this.prisma.specialistRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Өтінім табылмады');
    await this.moderatorAccess.assertCanModerateRequest(actor, request.regionId);
    assertRequestStatusTransition(request.status, RequestStatus.REJECTED);

    const reason = rejectionReason.trim();

    await this.prisma.$transaction(async (tx) => {
      await tx.specialistRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          moderatorId: actor.id,
          rejectionReason: reason,
          rejectedAt: new Date(),
        },
      });
      await tx.partnerProfile.update({
        where: { id: request.partnerProfileId },
        data: {
          status: PartnerStatus.REJECTED,
          requestStatus: RequestStatus.REJECTED,
          rejectionReason: reason,
          rejectedAt: new Date(),
          workStatus: WorkStatus.OFFLINE,
          isOnline: false,
        },
      });
      await tx.partnerModerationAuditLog.create({
        data: {
          partnerId: request.partnerProfileId,
          adminUserId: actor.id,
          action: PartnerModerationAction.REJECT,
          reason,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: {
          portalRoles: { set: [PortalRole.CLIENT] },
        },
      });
    });

    await this.notifications.notifyRejected(request.userId, reason);
    return this.getForModerator(actor, requestId);
  }

  assertSpecialistCanViewOrders(userId: string, requestStatus: RequestStatus | null | undefined) {
    if (requestStatus !== RequestStatus.APPROVED) {
      throw new ForbiddenException({
        message: 'Your application is under moderation.\nPlease wait for review results.',
        requestStatus: requestStatus ?? RequestStatus.PENDING,
      });
    }
  }
}
