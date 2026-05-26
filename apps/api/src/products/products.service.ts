import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PartnerDirection, PartnerOfferingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GP_SHOP_SUBSERVICE_ID } from '../common/partner-offerings.util';
import { assertApprovedStoreForOwner } from '../common/store-approval.util';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  private productInclude() {
    return {
      partner: {
        select: { id: true, company: true, user: { select: { name: true } } },
      },
    };
  }

  async findAll(partnerId?: string) {
    return this.prisma.product.findMany({
      where: partnerId ? { partnerId } : undefined,
      include: this.productInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProductDto) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    await assertApprovedStoreForOwner(this.prisma, userId);

    const shopOffering = await this.prisma.partnerServiceOffering.findUnique({
      where: {
        partnerId_subserviceId: { partnerId: profile.id, subserviceId: GP_SHOP_SUBSERVICE_ID },
      },
    });
    if (shopOffering?.status === PartnerOfferingStatus.TEMPORARILY_BLOCKED) {
      throw new ForbiddenException('Направление «Магазин» временно заблокировано модератором');
    }
    if (!shopOffering) {
      await this.prisma.partnerServiceOffering.create({
        data: {
          partnerId: profile.id,
          subserviceId: GP_SHOP_SUBSERVICE_ID,
          status: PartnerOfferingStatus.PENDING_MODERATION,
        },
      });
    }

    if (!profile.directions.includes(PartnerDirection.SHOP)) {
      await this.prisma.partnerProfile.update({
        where: { id: profile.id },
        data: { directions: [...profile.directions, PartnerDirection.SHOP] },
      });
    }
    await this.partners.syncDirectionsFromOfferings(profile.id);

    return this.prisma.product.create({
      data: {
        partnerId: profile.id,
        name: dto.name,
        price: dto.price,
        stock: dto.stock,
        category: dto.category,
        brand: dto.brand || profile.company || 'Partner',
        description: dto.description || '',
        specifications: dto.specifications?.trim() ? dto.specifications.trim() : null,
        inStock: dto.stock > 0,
      },
      include: this.productInclude(),
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        partner: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    if (!product) throw new NotFoundException('Товар не найден');
    return product;
  }
}
