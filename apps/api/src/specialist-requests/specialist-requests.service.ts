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
import { PartnerApplyDto } from '../partners/dto/partner-apply.dto';
import { RbacService } from '../rbac/rbac.service';
import { AccountStatusService } from '../user-status/account-status.service';
import { SpecialistModeratorAccessService } from './specialist-moderator-access.service';
import { SpecialistRequestNotificationsService } from './specialist-request-notifications.service';
import { assertRequestStatusTransition } from './specialist-request.transitions';
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
    private moderatorAccess: SpecialistModeratorAccessService,
    private notifications: SpecialistRequestNotificationsService,
    private rbac: RbacService,
    private accountStatus: AccountStatusService,
  ) {}

  private mapToApi(request: Prisma.SpecialistRequestGetPayload<{ include: typeof specialistInclude }>) {
    const profile = request.partnerProfile;
    const requestOfferings = profile.serviceOfferings.filter(
      (o) => o.specialistRequestId === request.id || !o.specialistRequestId,
    );
    return {
      id: request.id,
      userId: request.userId,
      partnerProfileId: request.partnerProfileId,
      regionId: request.regionId,
      city: request.city,
      district: request.district,
      categoryId: request.primaryCategory,
      primaryCategory: request.primaryCategory,
      subserviceIds: request.subserviceIds,
      subCategoryId: request.primarySubserviceId,
      status: request.status,
      moderatorId: request.moderatorId,
      approvedAt: request.approvedAt,
      rejectionReason: request.rejectionReason,
      rejectionReasonCode: request.rejectionReasonCode,
      rejectedAt: request.rejectedAt,
      resubmittedAt: request.resubmittedAt,
      profilePhotoUrl: request.profilePhotoUrl,
      idCardFrontUrl: request.idCardFrontUrl,
      idCardBackUrl: request.idCardBackUrl,
      vehicleData: request.vehicleData,
      equipmentPhotoUrls: request.equipmentPhotoUrls,
      workExperience: request.workExperience,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      specialistName: profile.fullName ?? profile.companyName ?? request.user.name,
      phoneNumber: request.user.phone,
      partnerStatus: profile.status,
      offerings: requestOfferings,
      region: request.region,
      uiMessage: this.uiMessageForStatus(request.status, request.rejectionReason),
      canEdit: request.status === RequestStatus.REJECTED,
      canResubmit: request.status === RequestStatus.REJECTED,
    };
  }

  private uiMessageForStatus(status: RequestStatus, rejectionReason?: string | null): string | null {
    if (status === RequestStatus.PENDING) {
      return 'Your application is under moderation.\nPlease wait for review results.';
    }
    if (status === RequestStatus.REJECTED) {
      return `Application Status: Rejected\n\nReason:\n${rejectionReason ?? ''}`;
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
    const items = await this.prisma.specialistRequest.findMany({
      where: { userId },
      include: specialistInclude,
      orderBy: { createdAt: 'desc' },
    });
    if (!items.length) {
      const profile = await this.prisma.partnerProfile.findUnique({
        where: { userId },
        include: { user: true, region: true, serviceOfferings: true },
      });
      if (!profile) throw new NotFoundException('Специалист өтінімі жоқ');
      return {
        applications: [],
        legacy: {
          status: profile.requestStatus,
          partnerStatus: profile.status,
          rejectionReason: profile.rejectionReason,
          uiMessage: profile.requestStatus
            ? this.uiMessageForStatus(profile.requestStatus, profile.rejectionReason)
            : 'Өтінім әлі жіберілмеген',
          canEdit: profile.requestStatus === RequestStatus.REJECTED,
          canResubmit: profile.requestStatus === RequestStatus.REJECTED,
          profile,
        },
      };
    }
    const applications = items.map((r) => this.mapToApi(r));
    const hasApproved = items.some((r) => r.status === RequestStatus.APPROVED);
    return {
      applications,
      hasApprovedApplication: hasApproved,
      latest: applications[0],
    };
  }

  async submit(_userId: string, _dto: PartnerApplyDto & { district?: string }) {
    throw new BadRequestException(
      'Use POST /api/specialist/applications (one application per main service).',
    );
  }

  async resubmit(_userId: string, _dto: PartnerApplyDto & { district?: string }) {
    throw new BadRequestException(
      'Use POST /api/specialist/applications with resubmitRequestId for rejected applications.',
    );
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
          rejectionReasonCode: null,
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
        where: { specialistRequestId: requestId },
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

  async reject(
    actor: User,
    requestId: string,
    rejectionReason: string,
    rejectionReasonCode?: import('@prisma/client').SpecialistRejectionReasonCode,
  ) {
    this.moderatorAccess.assertCanModerate(actor);
    const request = await this.prisma.specialistRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Өтінім табылмады');
    await this.moderatorAccess.assertCanModerateRequest(actor, request.regionId);
    assertRequestStatusTransition(request.status, RequestStatus.REJECTED);

    const reason = rejectionReason.trim();

    const otherApproved = await this.prisma.specialistRequest.count({
      where: {
        userId: request.userId,
        status: RequestStatus.APPROVED,
        id: { not: requestId },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.specialistRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          moderatorId: actor.id,
          rejectionReason: reason,
          rejectionReasonCode: rejectionReasonCode ?? undefined,
          rejectedAt: new Date(),
        },
      });
      await tx.partnerServiceOffering.updateMany({
        where: { specialistRequestId: requestId },
        data: { status: PartnerOfferingStatus.REJECTED, moderationNote: reason },
      });
      if (!otherApproved) {
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
        await tx.user.update({
          where: { id: request.userId },
          data: {
            portalRoles: { set: [PortalRole.CLIENT] },
          },
        });
      }
      await tx.partnerModerationAuditLog.create({
        data: {
          partnerId: request.partnerProfileId,
          adminUserId: actor.id,
          action: PartnerModerationAction.REJECT,
          reason,
        },
      });
    });

    await this.notifications.notifyRejected(request.userId, reason);
    return this.getForModerator(actor, requestId);
  }

  async assertSpecialistCanViewOrders(userId: string) {
    const approved = await this.prisma.specialistRequest.count({
      where: { userId, status: RequestStatus.APPROVED },
    });
    if (approved < 1) {
      const pending = await this.prisma.specialistRequest.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      });
      throw new ForbiddenException({
        message: 'Your application is under moderation.\nPlease wait for review results.',
        requestStatus: pending?.status ?? RequestStatus.PENDING,
      });
    }
  }
}
