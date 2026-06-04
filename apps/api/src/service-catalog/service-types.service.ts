import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateServiceTypeDto,
  CreateSubserviceTypeDto,
  UpdateServiceTypeDto,
  UpdateSubserviceTypeDto,
} from './service-catalog.dto';
import {
  assertLocalizedNames,
  mapServiceTypeRecord,
  mapSubserviceTypeRecord,
} from './service-catalog.types';

const typeInclude = {
  subserviceTypes: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class ServiceTypesService {
  constructor(private prisma: PrismaService) {}

  list(serviceCode?: string) {
    return this.prisma.serviceType
      .findMany({
        where: serviceCode ? { code: serviceCode } : undefined,
        include: typeInclude,
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      })
      .then((rows) => rows.map(mapServiceTypeRecord));
  }

  async get(id: string) {
    const row = await this.prisma.serviceType.findUnique({
      where: { id },
      include: typeInclude,
    });
    if (!row) throw new NotFoundException('Service type not found');
    return mapServiceTypeRecord(row);
  }

  async getByCode(code: string) {
    const row = await this.prisma.serviceType.findUnique({
      where: { code },
      include: typeInclude,
    });
    if (!row) throw new NotFoundException('Service type not found');
    return mapServiceTypeRecord(row);
  }

  async create(dto: CreateServiceTypeDto) {
    const code = dto.code.trim().toLowerCase();
    if (!code) throw new BadRequestException('code required');
    let names;
    try {
      names = assertLocalizedNames(dto.names);
    } catch {
      throw new BadRequestException('names.ru, names.kk, names.en are required');
    }
    const row = await this.prisma.serviceType.create({
      data: {
        code,
        names,
        active: dto.active !== false,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: typeInclude,
    });
    return mapServiceTypeRecord(row);
  }

  async update(id: string, dto: UpdateServiceTypeDto) {
    await this.get(id);
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code.trim().toLowerCase();
    if (dto.names) {
      try {
        data.names = assertLocalizedNames(dto.names);
      } catch {
        throw new BadRequestException('names.ru, names.kk, names.en are required');
      }
    }
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    const row = await this.prisma.serviceType.update({
      where: { id },
      data,
      include: typeInclude,
    });
    return mapServiceTypeRecord(row);
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.serviceType.delete({ where: { id } });
    return { ok: true };
  }

  async addSubservice(serviceTypeId: string, dto: CreateSubserviceTypeDto) {
    await this.get(serviceTypeId);
    const code = dto.code.trim().toLowerCase();
    let names;
    try {
      names = assertLocalizedNames(dto.names);
    } catch {
      throw new BadRequestException('names.ru, names.kk, names.en are required');
    }
    const count = await this.prisma.subserviceType.count({ where: { serviceTypeId } });
    await this.prisma.subserviceType.create({
      data: {
        serviceTypeId,
        code,
        names,
        active: dto.active !== false,
        sortOrder: dto.sortOrder ?? count,
      },
    });
    return this.get(serviceTypeId);
  }

  async updateSubservice(serviceTypeId: string, subId: string, dto: UpdateSubserviceTypeDto) {
    const sub = await this.prisma.subserviceType.findFirst({
      where: { id: subId, serviceTypeId },
    });
    if (!sub) throw new NotFoundException('Subservice type not found');
    const data: Record<string, unknown> = {};
    if (dto.code !== undefined) data.code = dto.code.trim().toLowerCase();
    if (dto.names) {
      try {
        data.names = assertLocalizedNames(dto.names);
      } catch {
        throw new BadRequestException('names.ru, names.kk, names.en are required');
      }
    }
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    await this.prisma.subserviceType.update({ where: { id: subId }, data });
    return this.get(serviceTypeId);
  }

  async removeSubservice(serviceTypeId: string, subId: string) {
    const sub = await this.prisma.subserviceType.findFirst({
      where: { id: subId, serviceTypeId },
    });
    if (!sub) throw new NotFoundException('Subservice type not found');
    await this.prisma.subserviceType.delete({ where: { id: subId } });
    return this.get(serviceTypeId);
  }
}

export { mapSubserviceTypeRecord };
