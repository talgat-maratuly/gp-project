import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCityPriceDto, UpdateCityPriceDto } from './service-catalog.dto';
import { mapCityPriceRecord } from './service-catalog.types';

const priceInclude = {
  serviceType: { select: { code: true, names: true } },
  subserviceType: { select: { code: true, names: true } },
};

@Injectable()
export class CityPricesService {
  constructor(private prisma: PrismaService) {}

  list(filters: {
    serviceCode?: string;
    cityId?: string;
    franchiseId?: string;
    oblastId?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.serviceCode) {
      where.serviceType = { code: filters.serviceCode };
    }
    if (filters.cityId) where.cityId = filters.cityId;
    if (filters.franchiseId) where.franchiseId = filters.franchiseId;
    if (filters.oblastId) where.oblastId = filters.oblastId;

    return this.prisma.cityServicePrice
      .findMany({
        where,
        include: priceInclude,
        orderBy: [{ cityId: 'asc' }, { priority: 'asc' }, { volumeStart: 'asc' }],
      })
      .then((rows) => rows.map(mapCityPriceRecord));
  }

  async get(id: string) {
    const row = await this.prisma.cityServicePrice.findUnique({
      where: { id },
      include: priceInclude,
    });
    if (!row) throw new NotFoundException('City price not found');
    return mapCityPriceRecord(row);
  }

  private async resolveServiceTypeId(dto: { serviceTypeId?: string; serviceCode?: string }) {
    if (dto.serviceTypeId) return dto.serviceTypeId;
    const code = dto.serviceCode?.trim().toLowerCase();
    if (!code) throw new BadRequestException('serviceCode or serviceTypeId required');
    const st = await this.prisma.serviceType.findUnique({ where: { code } });
    if (!st) throw new BadRequestException(`Service type "${code}" not found`);
    return st.id;
  }

  private async resolveSubserviceTypeId(
    serviceTypeId: string,
    dto: { subserviceTypeId?: string; subserviceCode?: string },
  ) {
    if (dto.subserviceTypeId) return dto.subserviceTypeId;
    const code = dto.subserviceCode?.trim().toLowerCase();
    if (!code) return null;
    const sub = await this.prisma.subserviceType.findUnique({
      where: { serviceTypeId_code: { serviceTypeId, code } },
    });
    if (!sub) throw new BadRequestException(`Subservice "${code}" not found`);
    return sub.id;
  }

  async create(dto: CreateCityPriceDto) {
    const serviceTypeId = await this.resolveServiceTypeId(dto);
    const subserviceTypeId = await this.resolveSubserviceTypeId(serviceTypeId, dto);

    let franchiseId = dto.franchiseId ?? null;
    if (!franchiseId && dto.cityId) {
      const fr = await this.prisma.franchise.findFirst({ where: { cityId: dto.cityId } });
      franchiseId = fr?.id ?? null;
    }

    const row = await this.prisma.cityServicePrice.create({
      data: {
        serviceTypeId,
        subserviceTypeId,
        oblastId: dto.oblastId ?? null,
        cityId: dto.cityId,
        franchiseId,
        price: dto.price,
        gpCommission: dto.gpCommission ?? 0,
        active: dto.active !== false,
        volumeStart: dto.volumeStart ?? null,
        volumeEnd: dto.volumeEnd ?? null,
        priority: dto.priority ?? 0,
      },
      include: priceInclude,
    });
    return mapCityPriceRecord(row);
  }

  async update(id: string, dto: UpdateCityPriceDto) {
    await this.get(id);
    const data: Record<string, unknown> = {};
    if (dto.oblastId !== undefined) data.oblastId = dto.oblastId;
    if (dto.cityId !== undefined) data.cityId = dto.cityId;
    if (dto.franchiseId !== undefined) data.franchiseId = dto.franchiseId;
    if (dto.subserviceTypeId !== undefined) data.subserviceTypeId = dto.subserviceTypeId;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.gpCommission !== undefined) data.gpCommission = dto.gpCommission;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.volumeStart !== undefined) data.volumeStart = dto.volumeStart;
    if (dto.volumeEnd !== undefined) data.volumeEnd = dto.volumeEnd;
    if (dto.priority !== undefined) data.priority = dto.priority;

    const row = await this.prisma.cityServicePrice.update({
      where: { id },
      data,
      include: priceInclude,
    });
    return mapCityPriceRecord(row);
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.cityServicePrice.delete({ where: { id } });
    return { ok: true };
  }
}
