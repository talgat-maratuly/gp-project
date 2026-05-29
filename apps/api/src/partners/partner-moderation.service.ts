import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountType, PartnerRole, PartnerType, RequestStatus } from '@prisma/client';
import { GP_SHOP_SUBSERVICE_ID } from '../common/partner-offerings.util';
import { normalizePartnerDocuments, validatePartnerRegistration } from '../common/account-type.util';
import { resolveSubserviceIdsForPartnerType } from '../common/partner-type.util';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerApplyDto } from './dto/partner-apply.dto';
import { PartnerResubmitDto } from './dto/partner-resubmit.dto';
import { PartnersService } from './partners.service';

const PartnerStatusValue = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  NEEDS_REVISION: 'NEEDS_REVISION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

const PartnerOfferingStatusValue = {
  PENDING_MODERATION: 'PENDING_MODERATION',
} as const;

const PartnerModerationActionValue = {
  RESUBMIT: 'RESUBMIT',
} as const;

@Injectable()
export class PartnerModerationService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  async getMe(userId: string) {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, regionId: true } },
        region: { select: { id: true, name: true, code: true } },
        serviceOfferings: { orderBy: { createdAt: 'asc' } },
        moderationAudit: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { admin: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!profile) throw new NotFoundException('Профиль партнёра не найден');
    return profile;
  }

  private resolvePartnerRole(dto: PartnerApplyDto): PartnerRole {
    if (dto.partnerRole) return dto.partnerRole;
    if (dto.partnerType === PartnerType.SHOP) return PartnerRole.SHOP;
    return PartnerRole.SPECIALIST;
  }

  private async resolveRegionForApply(userId: string, regionId?: string) {
    if (regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: regionId } });
      if (!region?.isActive) throw new NotFoundException('Регион не найден');
      return region;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.regionId) {
      const region = await this.prisma.region.findUnique({ where: { id: user.regionId } });
      if (region?.isActive) return region;
    }
    const fallback =
      (await this.prisma.region.findFirst({ where: { isActive: true, code: 'uralsk' } })) ??
      (await this.prisma.region.findFirst({ where: { isActive: true }, orderBy: { name: 'asc' } }));
    if (!fallback) {
      return this.prisma.region.create({
        data: { id: 'region_uralsk', code: 'uralsk', name: 'Уральск', isActive: true },
      });
    }
    return fallback;
  }

  async apply(userId: string, dto: PartnerApplyDto) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    if (profile.status === PartnerStatusValue.PENDING_REVIEW) {
      throw new BadRequestException('Заявка уже на проверке');
    }
    if (profile.status === PartnerStatusValue.APPROVED) {
      throw new BadRequestException('Партнёр уже подтверждён');
    }
    if (
      profile.status !== PartnerStatusValue.DRAFT &&
      profile.status !== PartnerStatusValue.NEEDS_REVISION &&
      profile.status !== PartnerStatusValue.REJECTED
    ) {
      throw new BadRequestException(`Нельзя отправить заявку из статуса ${profile.status}`);
    }

    const region = await this.resolveRegionForApply(userId, dto.regionId);
    const regionId = region.id;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.regionId && user.regionId !== regionId) {
      throw new ForbiddenException('Регион заявки не совпадает с регионом аккаунта');
    }

    const fullName = dto.fullName?.trim() || user?.name?.trim() || 'Тест партнёр GP';
    const companyName = dto.companyName?.trim() || fullName;
    const phone = dto.phone?.trim() || user?.phone?.trim() || `test_phone_${Date.now()}`;

    const documents = normalizePartnerDocuments(dto.documents) ?? [];
    if (dto.accountType === AccountType.LEGAL_ENTITY || dto.bin || dto.legalAddress) {
      validatePartnerRegistration({
        accountType: dto.accountType,
        name: fullName,
        company: companyName,
        bin: dto.bin,
        legalAddress: dto.legalAddress,
        idDocumentNumber: dto.idDocumentNumber,
        documents,
      });
    }

    let subIds = resolveSubserviceIdsForPartnerType(dto.partnerType, dto.subserviceIds);
    if (!subIds.length) {
      const role = this.resolvePartnerRole(dto);
      subIds =
        role === PartnerRole.SHOP || dto.partnerType === PartnerType.SHOP
          ? [GP_SHOP_SUBSERVICE_ID]
          : ['grass-mowing'];
    }
    const validatedSubs = this.partners.validateSubserviceIds(subIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { regionId, phone, name: fullName },
      });

      await tx.partnerProfile.update({
        where: { id: profile.id },
        data: {
          regionId,
          partnerType: dto.partnerType,
          partnerRole: this.resolvePartnerRole(dto),
          status: PartnerStatusValue.PENDING_REVIEW,
          requestStatus: RequestStatus.PENDING,
          accountType: dto.accountType,
          companyName,
          company: companyName,
          fullName,
          city: dto.city?.trim() || region.name,
          address: dto.address?.trim() || null,
          description: dto.description?.trim() || null,
          bin: dto.bin?.trim() || null,
          legalAddress: dto.legalAddress?.trim() || null,
          idDocumentNumber: dto.idDocumentNumber?.trim() || null,
          documents: documents.length ? documents : undefined,
          vehiclePhotos: dto.vehiclePhotos ?? [],
          equipmentPhotos: dto.equipmentPhotos ?? [],
          rejectionReason: null,
          revisionComment: null,
          rejectedAt: null,
        },
      });

      await tx.partnerServiceOffering.deleteMany({ where: { partnerId: profile.id } });
      await tx.partnerServiceOffering.createMany({
        data: validatedSubs.map((subserviceId) => ({
          partnerId: profile.id,
          subserviceId,
          status: PartnerOfferingStatusValue.PENDING_MODERATION,
        })),
      });

      await tx.partnerModerationAuditLog.create({
        data: {
          partnerId: profile.id,
          action: PartnerModerationActionValue.RESUBMIT,
          comment: 'Заявка отправлена на модерацию',
        },
      });
    });

    await this.partners.syncDirectionsFromOfferings(profile.id);
    await this.partners.syncServiceAccessFromOfferings(profile.id);
    return this.getMe(userId);
  }

  async resubmit(userId: string, dto: PartnerResubmitDto) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    const canResubmit =
      profile.status === PartnerStatusValue.NEEDS_REVISION ||
      profile.status === PartnerStatusValue.REJECTED ||
      profile.requestStatus === RequestStatus.REJECTED;
    if (!canResubmit) {
      throw new BadRequestException(
        'Повторная отправка доступна только после отклонения или возврата на доработку',
      );
    }
    if (!dto.partnerType || !dto.regionId || !dto.companyName || !dto.fullName || !dto.phone) {
      const current = await this.getMe(userId);
      return this.apply(userId, {
        partnerType: dto.partnerType ?? current.partnerType!,
        partnerRole: dto.partnerRole ?? current.partnerRole!,
        regionId: dto.regionId ?? current.regionId!,
        companyName: dto.companyName ?? current.companyName ?? current.company ?? '',
        fullName: dto.fullName ?? current.fullName ?? current.user.name,
        phone: dto.phone ?? current.user.phone ?? '',
        city: dto.city ?? current.city ?? undefined,
        address: dto.address ?? current.address ?? undefined,
        description: dto.description ?? current.description ?? undefined,
        accountType: dto.accountType ?? current.accountType,
        bin: dto.bin ?? current.bin ?? undefined,
        legalAddress: dto.legalAddress ?? current.legalAddress ?? undefined,
        idDocumentNumber: dto.idDocumentNumber ?? current.idDocumentNumber ?? undefined,
        documents: dto.documents,
        vehiclePhotos: dto.vehiclePhotos ?? (current.vehiclePhotos as string[]),
        equipmentPhotos: dto.equipmentPhotos ?? (current.equipmentPhotos as string[]),
        subserviceIds: dto.subserviceIds,
      });
    }
    return this.apply(userId, dto as PartnerApplyDto);
  }
}
