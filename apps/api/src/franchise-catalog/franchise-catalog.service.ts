import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFranchiseServiceDto,
  CreateFranchiseSubserviceDto,
  UpdateFranchiseServiceDto,
  UpdateFranchiseSubserviceDto,
  assertLocalizedNames,
  mapFranchiseRecord,
  mapServiceRecord,
} from './franchise-catalog.dto';

const serviceInclude = {
  subservices: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class FranchiseCatalogService {
  constructor(private prisma: PrismaService) {}

  listFranchises() {
    return this.prisma.franchise
      .findMany({ orderBy: { name: 'asc' } })
      .then((list) => list.map(mapFranchiseRecord));
  }

  listServices(franchiseId?: string) {
    return this.prisma.franchiseService
      .findMany({
        where: franchiseId ? { franchiseId } : undefined,
        include: serviceInclude,
        orderBy: [{ franchiseId: 'asc' }, { templateId: 'asc' }],
      })
      .then((list) => list.map(mapServiceRecord));
  }

  async getService(serviceId: string) {
    const row = await this.prisma.franchiseService.findUnique({
      where: { id: serviceId },
      include: serviceInclude,
    });
    if (!row) throw new NotFoundException('Service not found');
    return mapServiceRecord(row);
  }

  async createService(dto: CreateFranchiseServiceDto) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: dto.franchiseId },
    });
    if (!franchise) throw new BadRequestException('Franchise not found');

    let names: ReturnType<typeof assertLocalizedNames>;
    try {
      names = assertLocalizedNames(dto.names);
    } catch {
      throw new BadRequestException('names.ru, names.kk, names.en are required');
    }
    const templateId = dto.templateId?.trim() || `custom_${randomUUID().slice(0, 8)}`;

    const row = await this.prisma.franchiseService.create({
      data: {
        franchiseId: dto.franchiseId,
        templateId,
        cityId: dto.cityId ?? franchise.cityId,
        names,
        basePrice: dto.basePrice,
        gpCommission: dto.gpCommission,
        active: dto.active !== false,
      },
      include: serviceInclude,
    });
    return mapServiceRecord(row);
  }

  async updateService(serviceId: string, dto: UpdateFranchiseServiceDto) {
    await this.getService(serviceId);
    const data: Record<string, unknown> = {};
    if (dto.names) data.names = assertLocalizedNames(dto.names);
    if (dto.basePrice !== undefined) data.basePrice = dto.basePrice;
    if (dto.gpCommission !== undefined) data.gpCommission = dto.gpCommission;
    if (dto.active !== undefined) data.active = dto.active;

    const row = await this.prisma.franchiseService.update({
      where: { id: serviceId },
      data,
      include: serviceInclude,
    });
    return mapServiceRecord(row);
  }

  async removeService(serviceId: string) {
    await this.getService(serviceId);
    await this.prisma.franchiseService.delete({ where: { id: serviceId } });
    return { ok: true };
  }

  async addSubservice(serviceId: string, dto: CreateFranchiseSubserviceDto) {
    await this.getService(serviceId);
    const names = assertLocalizedNames(dto.names);
    const count = await this.prisma.franchiseSubservice.count({
      where: { franchiseServiceId: serviceId },
    });
    await this.prisma.franchiseSubservice.create({
      data: {
        franchiseServiceId: serviceId,
        externalId: dto.externalId ?? null,
        names,
        price: dto.price,
        gpCommission: dto.gpCommission,
        active: dto.active !== false,
        sortOrder: dto.sortOrder ?? count,
      },
    });
    return this.getService(serviceId);
  }

  async updateSubservice(
    serviceId: string,
    subId: string,
    dto: UpdateFranchiseSubserviceDto,
  ) {
    const sub = await this.prisma.franchiseSubservice.findFirst({
      where: { id: subId, franchiseServiceId: serviceId },
    });
    if (!sub) throw new NotFoundException('Subservice not found');

    const data: Record<string, unknown> = {};
    if (dto.names) data.names = assertLocalizedNames(dto.names);
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.gpCommission !== undefined) data.gpCommission = dto.gpCommission;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    await this.prisma.franchiseSubservice.update({
      where: { id: subId },
      data,
    });
    return this.getService(serviceId);
  }

  async removeSubservice(serviceId: string, subId: string) {
    const sub = await this.prisma.franchiseSubservice.findFirst({
      where: { id: subId, franchiseServiceId: serviceId },
    });
    if (!sub) throw new NotFoundException('Subservice not found');
    await this.prisma.franchiseSubservice.delete({ where: { id: subId } });
    return this.getService(serviceId);
  }
}
