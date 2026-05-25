import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const region = await this.prisma.region.findUnique({ where: { id: dto.regionId } });
    if (!region?.isActive) throw new NotFoundException('Регион не найден');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.regionId && user.regionId !== dto.regionId) {
      throw new ForbiddenException('Регион заявки не совпадает с регионом аккаунта');
    }

    const documents = normalizePartnerDocuments(dto.documents) ?? [];
    validatePartnerRegistration({
      accountType: dto.accountType,
      name: dto.fullName,
      company: dto.companyName,
      bin: dto.bin,
      legalAddress: dto.legalAddress,
      idDocumentNumber: dto.idDocumentNumber,
      documents,
    });

    const subIds = resolveSubserviceIdsForPartnerType(dto.partnerType, dto.subserviceIds);
    if (!subIds.length) {
      throw new BadRequestException('Укажите подуслуги для выбранного типа партнёра');
    }
    const validatedSubs = this.partners.validateSubserviceIds(subIds);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { regionId: dto.regionId, phone: dto.phone, name: dto.fullName.trim() },
      });

      await tx.partnerProfile.update({
        where: { id: profile.id },
        data: {
          regionId: dto.regionId,
          partnerType: dto.partnerType,
          status: PartnerStatusValue.PENDING_REVIEW,
          accountType: dto.accountType,
          companyName: dto.companyName.trim(),
          company: dto.companyName.trim(),
          fullName: dto.fullName.trim(),
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
    if (profile.status !== PartnerStatusValue.NEEDS_REVISION) {
      throw new BadRequestException('Повторная отправка доступна только после возврата на доработку');
    }
    if (!dto.partnerType || !dto.regionId || !dto.companyName || !dto.fullName || !dto.phone) {
      const current = await this.getMe(userId);
      return this.apply(userId, {
        partnerType: dto.partnerType ?? current.partnerType!,
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
