import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderCategory,
  PartnerRole,
  PartnerStatus,
  PartnerType,
  PortalRole,
  Prisma,
  RequestStatus,
  Role,
  WorkStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpecialistRequestNotificationsService } from '../specialist-requests/specialist-request-notifications.service';
import { SubmitOnboardingApplicationDto } from './dto/submit-onboarding-application.dto';
import { validateOnboardingPayload } from './specialist-onboarding.validation';
import { ONBOARDING_CATALOG, subservicesForMain } from './specialist-onboarding.catalog';
import { CatalogBuilderService } from '../service-catalog/catalog-builder.service';
import {
  assertCanResubmit,
  assertRequestStatusTransition,
} from '../specialist-requests/specialist-request.transitions';

const includeRequest = {
  region: { select: { id: true, name: true, code: true } },
  offerings: true,
  partnerProfile: {
    select: { id: true, fullName: true, status: true, city: true },
  },
};

@Injectable()
export class SpecialistOnboardingService {
  constructor(
    private prisma: PrismaService,
    private notifications: SpecialistRequestNotificationsService,
    private catalogBuilder: CatalogBuilderService,
  ) {}

  getCatalog() {
    return ONBOARDING_CATALOG;
  }

  async getSubservicesForCity(cityId: string, mainServiceId: string) {
    const fromDb = await this.catalogBuilder.getOnboardingSubservices(cityId, mainServiceId);
    if (fromDb.length) return fromDb;
    return subservicesForMain(mainServiceId as import('./specialist-onboarding.catalog').MainServiceId).map(
      (s) => ({ id: s.id, label: s.label, price: null }),
    );
  }

  private async resolveAllowedSubserviceIds(dto: SubmitOnboardingApplicationDto) {
    const cityId =
      dto.cityId?.trim() ||
      (await this.catalogBuilder.resolveCityId(null, dto.city, null));
    if (!cityId) {
      return subservicesForMain(dto.mainServiceId as import('./specialist-onboarding.catalog').MainServiceId).map(
        (s) => s.id,
      );
    }
    const subs = await this.getSubservicesForCity(cityId, dto.mainServiceId);
    return subs.map((s) => s.id);
  }

  async listMyApplications(userId: string) {
    const rows = await this.prisma.specialistRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: includeRequest,
    });
    return rows.map((r) => this.mapApplication(r));
  }

  async getMyApplication(userId: string, requestId: string) {
    const row = await this.prisma.specialistRequest.findFirst({
      where: { id: requestId, userId },
      include: includeRequest,
    });
    if (!row) throw new NotFoundException('Application not found');
    return this.mapApplication(row);
  }

  private async assertActiveRegion(regionId: string) {
    const region = await this.prisma.region.findFirst({
      where: { id: regionId.trim(), isActive: true },
    });
    if (!region) {
      throw new BadRequestException('Регион не найден или неактивен');
    }
    return region;
  }

  async submit(userId: string, dto: SubmitOnboardingApplicationDto) {
    await this.assertActiveRegion(dto.regionId);
    const allowedSubs = await this.resolveAllowedSubserviceIds(dto);
    const { primaryCategory } = validateOnboardingPayload(dto, allowedSubs);
    const profile = await this.ensurePartnerProfile(userId);

    if (dto.resubmitRequestId) {
      return this.resubmitExisting(userId, dto.resubmitRequestId, dto, primaryCategory, profile.id);
    }

    const pendingSameCategory = await this.prisma.specialistRequest.findFirst({
      where: { userId, primaryCategory, status: RequestStatus.PENDING },
    });
    if (pendingSameCategory) {
      throw new BadRequestException(
        `Бұл қызмет (${dto.mainServiceId}) бойынша өтініміңіз тексеруде. Жаңасын жіберуге болмайды — модерация нәтижесін күтіңіз.`,
      );
    }

    const rejectedSameCategory = await this.prisma.specialistRequest.findFirst({
      where: { userId, primaryCategory, status: RequestStatus.REJECTED },
      orderBy: { updatedAt: 'desc' },
    });
    if (rejectedSameCategory && !dto.resubmitRequestId) {
      throw new BadRequestException(
        `Бұл қызмет бойынша өтінім қабылданбады. Қайта жіберу үшін профильден «Өңдеу» немесе resubmitRequestId=${rejectedSameCategory.id} қолданыңыз.`,
      );
    }

    const duplicateSubs = await this.prisma.specialistRequest.findFirst({
      where: {
        userId,
        status: RequestStatus.APPROVED,
        subserviceIds: { hasSome: dto.subserviceIds },
      },
    });
    if (duplicateSubs) {
      throw new BadRequestException(
        'Бұл подуслугалар бекітілген. Тек жаңа подуслуга үшін жаңа өтінім жіберіңіз.',
      );
    }

    const conflictingOfferings = await this.prisma.partnerServiceOffering.findMany({
      where: {
        partnerId: profile.id,
        subserviceId: { in: dto.subserviceIds },
        specialistRequest: { status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] } },
      },
      select: { subserviceId: true, specialistRequest: { select: { status: true, primaryCategory: true } } },
    });
    if (conflictingOfferings.length) {
      const subs = conflictingOfferings.map((o) => o.subserviceId).join(', ');
      throw new BadRequestException(
        `Подуслугалар (${subs}) бойынша өтінім қазірдің өзінде бар. Басқа подуслуга таңдаңыз немесе модерацияны күтіңіз.`,
      );
    }

    const partnerType = this.partnerTypeForCategory(primaryCategory);

    let request: { id: string; regionId: string };
    try {
      request = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          regionId: dto.regionId,
          phone: dto.phone.trim(),
          name: dto.fullName.trim(),
          portalRoles: { set: [PortalRole.CLIENT] },
        },
      });

      await tx.partnerProfile.update({
        where: { id: profile.id },
        data: {
          regionId: dto.regionId,
          city: dto.city.trim(),
          fullName: dto.fullName.trim(),
          partnerType,
          partnerRole: PartnerRole.SPECIALIST,
          status: PartnerStatus.PENDING_REVIEW,
          requestStatus: RequestStatus.PENDING,
          workStatus: WorkStatus.OFFLINE,
          isOnline: false,
        },
      });

      const created = await tx.specialistRequest.create({
        data: {
          userId,
          partnerProfileId: profile.id,
          regionId: dto.regionId,
          city: dto.city.trim(),
          district: dto.district?.trim() || null,
          primaryCategory,
          subserviceIds: dto.subserviceIds,
          primarySubserviceId: dto.subserviceIds[0],
          status: RequestStatus.PENDING,
          profilePhotoUrl: dto.profilePhotoUrl,
          idCardFrontUrl: dto.idCardFrontUrl,
          idCardBackUrl: dto.idCardBackUrl,
          vehicleData: dto.vehicle ? (dto.vehicle as object) : undefined,
          equipmentPhotoUrls: dto.equipmentPhotoUrls ?? [],
          workExperience: dto.workExperience?.trim() || null,
          termsAcceptedAt: dto.termsAccepted ? new Date() : null,
          personalDataAcceptedAt: dto.personalDataAccepted ? new Date() : null,
        },
      });

      for (const subserviceId of dto.subserviceIds) {
        await tx.partnerServiceOffering.upsert({
          where: {
            partnerId_subserviceId: { partnerId: profile.id, subserviceId },
          },
          create: {
            partnerId: profile.id,
            specialistRequestId: created.id,
            subserviceId,
            status: 'PENDING_MODERATION',
          },
          update: {
            specialistRequestId: created.id,
            status: 'PENDING_MODERATION',
          },
        });
      }

      return created;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const any = await this.prisma.specialistRequest.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        throw new BadRequestException(
          any
            ? `Сізде өтінім бар (${any.status}, ${any.primaryCategory}). Бір қызметке бір актив өтінім. Ескі БД шектеуі болса: npm run prisma:migrate:deploy`
            : 'Бұл деректер бойынша жазба бар (P2002). Подуслуга қайталануы мүмкін.',
        );
      }
      throw err;
    }

    await this.notifications.notifySubmitted(userId, request.regionId, false);

    return this.getMyApplication(userId, request.id);
  }

  private async resubmitExisting(
    userId: string,
    requestId: string,
    dto: SubmitOnboardingApplicationDto,
    primaryCategory: OrderCategory,
    partnerProfileId: string,
  ) {
    const existing = await this.prisma.specialistRequest.findFirst({
      where: { id: requestId, userId },
    });
    if (!existing) throw new NotFoundException('Application not found');
    assertCanResubmit(existing.status);
    if (existing.status === RequestStatus.APPROVED) {
      throw new ForbiddenException('Approved applications cannot be edited via resubmit');
    }
    assertRequestStatusTransition(existing.status, RequestStatus.PENDING);

    const request = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.specialistRequest.update({
        where: { id: requestId },
        data: {
          regionId: dto.regionId,
          city: dto.city.trim(),
          district: dto.district?.trim() || null,
          primaryCategory,
          subserviceIds: dto.subserviceIds,
          primarySubserviceId: dto.subserviceIds[0],
          status: RequestStatus.PENDING,
          profilePhotoUrl: dto.profilePhotoUrl,
          idCardFrontUrl: dto.idCardFrontUrl,
          idCardBackUrl: dto.idCardBackUrl,
          vehicleData: dto.vehicle ? (dto.vehicle as object) : undefined,
          equipmentPhotoUrls: dto.equipmentPhotoUrls ?? [],
          workExperience: dto.workExperience?.trim() || null,
          termsAcceptedAt: new Date(),
          personalDataAcceptedAt: new Date(),
          rejectionReason: null,
          rejectionReasonCode: null,
          rejectedAt: null,
          resubmittedAt: new Date(),
        },
      });

      await tx.partnerProfile.update({
        where: { id: partnerProfileId },
        data: {
          status: PartnerStatus.PENDING_REVIEW,
          requestStatus: RequestStatus.PENDING,
        },
      });

      for (const subserviceId of dto.subserviceIds) {
        await tx.partnerServiceOffering.upsert({
          where: {
            partnerId_subserviceId: { partnerId: partnerProfileId, subserviceId },
          },
          create: {
            partnerId: partnerProfileId,
            specialistRequestId: requestId,
            subserviceId,
            status: 'PENDING_MODERATION',
          },
          update: {
            specialistRequestId: requestId,
            status: 'PENDING_MODERATION',
          },
        });
      }

      return updated;
    });

    await this.notifications.notifySubmitted(userId, request.regionId, true);
    return this.getMyApplication(userId, request.id);
  }

  private async ensurePartnerProfile(userId: string) {
    let profile = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.PARTNER },
      });
      profile = await this.prisma.partnerProfile.create({
        data: {
          userId,
          status: PartnerStatus.DRAFT,
          partnerRole: PartnerRole.SPECIALIST,
          fullName: user.name,
          companyName: user.name,
          regionId: user.regionId,
        },
      });
    }
    return profile;
  }

  private partnerTypeForCategory(category: OrderCategory): PartnerType {
    const map: Partial<Record<OrderCategory, PartnerType>> = {
      [OrderCategory.SEPTIC]: PartnerType.SEPTIC_SERVICE,
      [OrderCategory.LAWN]: PartnerType.LAWN_MOWING,
      [OrderCategory.AUTOWATERING]: PartnerType.IRRIGATION_SERVICE,
      [OrderCategory.FILTERS]: PartnerType.SPECIALIST,
      [OrderCategory.PUMPS]: PartnerType.OTHER,
    };
    return map[category] ?? PartnerType.OTHER;
  }

  private mapApplication(r: {
    id: string;
    status: RequestStatus;
    primaryCategory: OrderCategory;
    subserviceIds: string[];
    city: string | null;
    district?: string | null;
    rejectionReason: string | null;
    rejectionReasonCode: string | null;
    profilePhotoUrl?: string | null;
    idCardFrontUrl?: string | null;
    idCardBackUrl?: string | null;
    vehicleData?: unknown;
    equipmentPhotoUrls?: string[];
    workExperience?: string | null;
    region: { id: string; name: string; code: string };
    offerings?: { subserviceId: string; status: string }[];
  }) {
    const canEdit = r.status === RequestStatus.REJECTED;
    return {
      id: r.id,
      status: r.status,
      mainServiceId: r.primaryCategory,
      subserviceIds: r.subserviceIds,
      city: r.city,
      district: r.district ?? null,
      region: r.region,
      profilePhotoUrl: r.profilePhotoUrl ?? null,
      idCardFrontUrl: r.idCardFrontUrl ?? null,
      idCardBackUrl: r.idCardBackUrl ?? null,
      vehicleData: r.vehicleData ?? null,
      equipmentPhotoUrls: r.equipmentPhotoUrls ?? [],
      workExperience: r.workExperience ?? null,
      rejectionReason: r.rejectionReason,
      rejectionReasonCode: r.rejectionReasonCode,
      offerings: r.offerings,
      canEdit,
      canResubmit: canEdit,
      editable: canEdit,
      uiMessage:
        r.status === RequestStatus.PENDING
          ? 'Your application is under moderation.\nPlease wait for review results.'
          : r.status === RequestStatus.REJECTED
            ? `Application Status: Rejected\n\nReason:\n${r.rejectionReason ?? ''}`
            : null,
      submittedScreen: r.status === RequestStatus.PENDING ? ONBOARDING_CATALOG.submittedUi : null,
    };
  }

  /** Кемде кем бір APPROVED өтінім бар ма */
  async hasApprovedApplication(userId: string): Promise<boolean> {
    const n = await this.prisma.specialistRequest.count({
      where: { userId, status: RequestStatus.APPROVED },
    });
    return n > 0;
  }
}
