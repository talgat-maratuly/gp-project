import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AccountType,
  GrowingPreorderStatus,
  NurseryOfferStatus,
  NurseryRequestStatus,
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

function cityIdFrom(body: any) {
  return body?.cityId?.trim?.() || 'city-uralsk';
}

function cityFrom(body: any) {
  return body?.city?.trim?.() || 'Уральск';
}

@Injectable()
export class NurseryService {
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

  private async approvedNurseryForUser(user: User) {
    const partner = await this.partnerProfile(user);
    if (partner.partnerType !== PartnerType.NURSERY) throw new ForbiddenException('NURSERY_PARTNER_REQUIRED');
    const nursery = await this.prisma.nursery.findFirst({
      where: { partnerId: partner.id, status: PartnerStatus.APPROVED },
    });
    if (!nursery) throw new ForbiddenException('NURSERY_NOT_APPROVED');
    return { partner, nursery };
  }

  async apply(user: User, body: any) {
    const partner = await this.partnerProfile(user);
    const cityId = cityIdFrom(body);
    const city = cityFrom(body);
    return this.prisma.$transaction(async (tx) => {
      const updatedPartner = await tx.partnerProfile.update({
        where: { id: partner.id },
        data: {
          partnerType: PartnerType.NURSERY,
          status: PartnerStatus.PENDING_REVIEW,
          accountType: body?.accountType === AccountType.INDIVIDUAL ? AccountType.INDIVIDUAL : AccountType.LEGAL_ENTITY,
          companyName: body?.name || body?.companyName || partner.companyName,
          bin: body?.bin || partner.bin,
          address: body?.address || partner.address,
          city,
          directions: [PartnerDirection.NURSERY],
        },
      });
      const existingNursery = await tx.nursery.findFirst({ where: { partnerId: partner.id } });
      const nurseryData = {
        cityId,
        city,
        name: body?.name || body?.companyName || updatedPartner.companyName || 'Питомник GP',
        legalForm: body?.legalForm,
        bin: body?.bin,
        address: body?.address,
        phone: body?.phone || user.phone,
        description: body?.description,
        delivers: Boolean(body?.delivers),
        growsToOrder: Boolean(body?.growsToOrder),
        categories: Array.isArray(body?.categories) ? body.categories : [],
        serviceCities: Array.isArray(body?.serviceCities) ? body.serviceCities : [cityId],
        status: PartnerStatus.PENDING_REVIEW,
      };
      const nursery = existingNursery
        ? await tx.nursery.update({
          where: { id: existingNursery.id },
          data: nurseryData,
        })
        : await tx.nursery.create({
          data: {
            ...nurseryData,
          partnerId: partner.id,
          },
        });
      return { partner: updatedPartner, nursery };
    });
  }

  async myNursery(user: User) {
    const partner = await this.partnerProfile(user);
    return this.prisma.nursery.findFirst({
      where: { partnerId: partner.id },
      include: { products: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async createProduct(user: User, body: any) {
    const { partner, nursery } = await this.approvedNurseryForUser(user);
    return this.prisma.nurseryProduct.create({
      data: {
        nurseryId: nursery.id,
        partnerId: partner.id,
        cityId: nursery.cityId,
        category: body?.category || body?.plantType || 'plants',
        plantType: body?.plantType,
        name: body?.name,
        description: body?.description,
        images: Array.isArray(body?.images) ? body.images : [],
        quantity: toInt(body?.quantity),
        heightCm: body?.heightCm ? toInt(body.heightCm) : undefined,
        sizeLabel: body?.sizeLabel,
        ageMonths: body?.ageMonths ? toInt(body.ageMonths) : undefined,
        price: toDecimal(body?.price),
        availability: body?.availability || 'AVAILABLE',
        delivery: Boolean(body?.delivery),
        growToOrder: Boolean(body?.growToOrder),
      },
    });
  }

  async listPublicProducts(query: any = {}) {
    return this.prisma.nurseryProduct.findMany({
      where: {
        ...(query.cityId ? { cityId: query.cityId } : {}),
        ...(query.category ? { category: query.category } : {}),
        availability: { in: ['AVAILABLE', 'PREORDER_ONLY'] },
        nursery: { status: PartnerStatus.APPROVED },
      },
      include: { nursery: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyProducts(user: User) {
    const partner = await this.partnerProfile(user);
    return this.prisma.nurseryProduct.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(user: User, body: any) {
    const client = await this.clientProfile(user);
    return this.prisma.nurseryRequest.create({
      data: {
        clientId: client.id,
        cityId: cityIdFrom(body),
        city: cityFrom(body),
        plantType: body?.plantType,
        plantName: body?.plantName || body?.name,
        quantity: toInt(body?.quantity, 1),
        heightCm: body?.heightCm ? toInt(body.heightCm) : undefined,
        ageMonths: body?.ageMonths ? toInt(body.ageMonths) : undefined,
        desiredDeliveryAt: toDate(body?.desiredDeliveryAt),
        deliveryNeeded: Boolean(body?.deliveryNeeded),
        comment: body?.comment,
        examplePhotoUrl: body?.examplePhotoUrl,
      },
      include: { offers: true },
    });
  }

  async myRequests(user: User) {
    const client = await this.clientProfile(user);
    return this.prisma.nurseryRequest.findMany({
      where: { clientId: client.id },
      include: { offers: { include: { nursery: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestFeed(user: User) {
    const { nursery } = await this.approvedNurseryForUser(user);
    const rows = await this.prisma.nurseryRequest.findMany({
      where: { status: { in: [NurseryRequestStatus.CREATED, NurseryRequestStatus.OFFERED] } },
      include: { offers: { where: { nurseryId: nursery.id } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.filter((r) => {
      const cityOk = r.cityId === nursery.cityId || nursery.serviceCities.includes(r.cityId);
      const categoryOk = !nursery.categories.length || !r.plantType || nursery.categories.includes(r.plantType);
      return cityOk && categoryOk;
    });
  }

  async createOffer(user: User, requestId: string, body: any) {
    const { partner, nursery } = await this.approvedNurseryForUser(user);
    const request = await this.prisma.nurseryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('NURSERY_REQUEST_NOT_FOUND');
    const offer = await this.prisma.nurseryOffer.upsert({
      where: { requestId_nurseryId: { requestId, nurseryId: nursery.id } },
      create: {
        requestId,
        nurseryId: nursery.id,
        partnerId: partner.id,
        cityId: nursery.cityId,
        pricePerUnit: toDecimal(body?.pricePerUnit) ?? new Prisma.Decimal(0),
        availableQty: toInt(body?.availableQty, request.quantity),
        photoUrl: body?.photoUrl,
        supplyDate: toDate(body?.supplyDate),
        deliveryTerms: body?.deliveryTerms,
        comment: body?.comment,
      },
      update: {
        pricePerUnit: toDecimal(body?.pricePerUnit) ?? new Prisma.Decimal(0),
        availableQty: toInt(body?.availableQty, request.quantity),
        photoUrl: body?.photoUrl,
        supplyDate: toDate(body?.supplyDate),
        deliveryTerms: body?.deliveryTerms,
        comment: body?.comment,
        status: NurseryOfferStatus.SENT,
      },
    });
    await this.prisma.nurseryRequest.update({
      where: { id: requestId },
      data: { status: NurseryRequestStatus.OFFERED },
    });
    return offer;
  }

  async acceptOffer(user: User, offerId: string) {
    const client = await this.clientProfile(user);
    const offer = await this.prisma.nurseryOffer.findUnique({ where: { id: offerId }, include: { request: true } });
    if (!offer || offer.request.clientId !== client.id) throw new NotFoundException('NURSERY_OFFER_NOT_FOUND');
    return this.prisma.$transaction(async (tx) => {
      await tx.nurseryOffer.updateMany({
        where: { requestId: offer.requestId, id: { not: offer.id } },
        data: { status: NurseryOfferStatus.REJECTED },
      });
      const accepted = await tx.nurseryOffer.update({
        where: { id: offer.id },
        data: { status: NurseryOfferStatus.ACCEPTED },
      });
      await tx.nurseryRequest.update({
        where: { id: offer.requestId },
        data: { status: NurseryRequestStatus.ACCEPTED, acceptedOfferId: offer.id },
      });
      return accepted;
    });
  }

  async createPreorder(user: User, body: any) {
    const client = await this.clientProfile(user);
    return this.prisma.growingPreorder.create({
      data: {
        clientId: client.id,
        cityId: cityIdFrom(body),
        city: cityFrom(body),
        plantName: body?.plantName || body?.name,
        quantity: toInt(body?.quantity, 1),
        deliveryDate: toDate(body?.deliveryDate),
        sizeRequirement: body?.sizeRequirement,
        varietyRequirement: body?.varietyRequirement,
        deliveryNeeded: Boolean(body?.deliveryNeeded),
        contractNeeded: Boolean(body?.contractNeeded),
        comment: body?.comment,
      },
      include: { offers: true },
    });
  }

  async myPreorders(user: User) {
    const client = await this.clientProfile(user);
    return this.prisma.growingPreorder.findMany({
      where: { clientId: client.id },
      include: { offers: { include: { partner: true }, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async preorderFeed(user: User) {
    const { nursery } = await this.approvedNurseryForUser(user);
    return this.prisma.growingPreorder.findMany({
      where: {
        cityId: { in: [nursery.cityId, ...nursery.serviceCities] },
        status: { in: [GrowingPreorderStatus.CREATED, GrowingPreorderStatus.OFFERED] },
      },
      include: { offers: { where: { partnerId: nursery.partnerId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPreorderOffer(user: User, preorderId: string, body: any) {
    const { partner, nursery } = await this.approvedNurseryForUser(user);
    const preorder = await this.prisma.growingPreorder.findUnique({ where: { id: preorderId } });
    if (!preorder) throw new NotFoundException('GROWING_PREORDER_NOT_FOUND');
    const pricePerUnit = toDecimal(body?.pricePerUnit) ?? new Prisma.Decimal(0);
    const totalAmount = pricePerUnit.mul(toInt(preorder.quantity, 1));
    const offer = await this.prisma.growingContract.upsert({
      where: { preorderId_partnerId: { preorderId, partnerId: partner.id } },
      create: {
        preorderId,
        partnerId: partner.id,
        cityId: nursery.cityId,
        pricePerUnit,
        totalAmount,
        readyDate: toDate(body?.readyDate),
        minBatch: body?.minBatch ? toInt(body.minBatch) : undefined,
        paymentTerms: body?.paymentTerms,
        similarPhotoUrl: body?.similarPhotoUrl,
        comment: body?.comment,
        growingSchedule: Array.isArray(body?.growingSchedule) ? body.growingSchedule : [],
      },
      update: {
        pricePerUnit,
        totalAmount,
        readyDate: toDate(body?.readyDate),
        minBatch: body?.minBatch ? toInt(body.minBatch) : undefined,
        paymentTerms: body?.paymentTerms,
        similarPhotoUrl: body?.similarPhotoUrl,
        comment: body?.comment,
        status: NurseryOfferStatus.SENT,
        contractStatus: GrowingPreorderStatus.OFFERED,
      },
    });
    await this.prisma.growingPreorder.update({
      where: { id: preorderId },
      data: { status: GrowingPreorderStatus.OFFERED },
    });
    return offer;
  }

  async acceptPreorderOffer(user: User, offerId: string) {
    const client = await this.clientProfile(user);
    const offer = await this.prisma.growingContract.findUnique({ where: { id: offerId }, include: { preorder: true } });
    if (!offer || offer.preorder.clientId !== client.id) throw new NotFoundException('GROWING_OFFER_NOT_FOUND');
    return this.prisma.$transaction(async (tx) => {
      await tx.growingContract.updateMany({
        where: { preorderId: offer.preorderId, id: { not: offer.id } },
        data: { status: NurseryOfferStatus.REJECTED },
      });
      const accepted = await tx.growingContract.update({
        where: { id: offer.id },
        data: { status: NurseryOfferStatus.ACCEPTED, contractStatus: GrowingPreorderStatus.CONTRACT_PENDING },
      });
      await tx.growingPreorder.update({
        where: { id: offer.preorderId },
        data: { status: GrowingPreorderStatus.CONTRACT_PENDING, acceptedOfferId: offer.id },
      });
      return accepted;
    });
  }

  async adminNurseries(status?: PartnerStatus) {
    return this.prisma.nursery.findMany({
      where: status ? { status } : {},
      include: { partner: { include: { user: true } }, products: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminSetNurseryStatus(id: string, status: PartnerStatus) {
    const nursery = await this.prisma.nursery.findUnique({ where: { id } });
    if (!nursery) throw new NotFoundException('NURSERY_NOT_FOUND');
    const allowedStatuses: PartnerStatus[] = [PartnerStatus.APPROVED, PartnerStatus.REJECTED, PartnerStatus.SUSPENDED];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('UNSUPPORTED_STATUS');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.nursery.update({ where: { id }, data: { status } });
      await tx.partnerProfile.update({
        where: { id: nursery.partnerId },
        data: {
          status,
          partnerType: PartnerType.NURSERY,
          directions: status === PartnerStatus.APPROVED ? [PartnerDirection.NURSERY] : undefined,
        },
      });
      return updated;
    });
  }

  adminRequests() {
    return this.prisma.nurseryRequest.findMany({
      include: { client: { include: { user: true } }, offers: { include: { nursery: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  adminPreorders() {
    return this.prisma.growingPreorder.findMany({
      include: { client: { include: { user: true } }, offers: { include: { partner: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
