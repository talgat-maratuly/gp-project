import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, ServiceProjectStatus, ServiceProjectType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FurnitureExecutorService } from '../furniture-executor/furniture-executor.service';

@Injectable()
export class ServiceProjectsService {
  constructor(
    private prisma: PrismaService,
    private furnitureExecutor: FurnitureExecutorService,
  ) {}

  private async clientProfileId(userId: string) {
    const c = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!c) throw new ForbiddenException('Client profile required');
    return c;
  }

  private async partnerProfileId(userId: string) {
    const p = await this.prisma.partnerProfile.findUnique({ where: { userId } });
    if (!p) throw new ForbiddenException('Partner profile required');
    return p;
  }

  async findAll(userId: string, role: Role, query: { type?: ServiceProjectType; status?: ServiceProjectStatus }) {
    const where: Prisma.ServiceProjectWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (role === Role.CLIENT) {
      const client = await this.clientProfileId(userId);
      where.clientId = client.id;
    } else if (role === Role.PARTNER) {
      const partner = await this.partnerProfileId(userId);
      where.OR = [{ partnerId: partner.id }, { status: ServiceProjectStatus.submitted, partnerId: null }];
      if (query.type) where.type = query.type;
    }

    return this.prisma.serviceProject.findMany({
      where,
      include: { hunter: true, furniture: true, client: { include: { user: true } }, partner: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: Role) {
    const project = await this.prisma.serviceProject.findUnique({
      where: { id },
      include: { hunter: true, furniture: true, client: { include: { user: true } }, partner: { include: { user: true } } },
    });
    if (!project) throw new NotFoundException();
    if (role === Role.CLIENT) {
      const client = await this.clientProfileId(userId);
      if (project.clientId !== client.id) throw new ForbiddenException();
    }
    return project;
  }

  async updateStatus(id: string, userId: string, role: Role, status: ServiceProjectStatus) {
    const project = await this.findOne(id, userId, role);
    const data: Prisma.ServiceProjectUpdateInput = { status };
    if (role === Role.PARTNER && status === ServiceProjectStatus.assigned) {
      const partner = await this.partnerProfileId(userId);
      data.partner = { connect: { id: partner.id } };
    }
    return this.prisma.serviceProject.update({
      where: { id: project.id },
      data,
      include: { hunter: true, furniture: true },
    });
  }

  async createHunter(userId: string, dto: {
    photo?: string; length: number; width: number; waterSource: string;
    pressure: number; waterFlow: number; submit?: boolean;
  }) {
    const client = await this.clientProfileId(userId);
    const linked = await this.prisma.product.findMany({
      where: { linkedServiceType: 'hunter_irrigation', inStock: true },
      take: 20,
    });
    const calc = this.calcHunter(dto, linked);

    const status = dto.submit ? ServiceProjectStatus.submitted : ServiceProjectStatus.draft;
    return this.prisma.serviceProject.create({
      data: {
        type: ServiceProjectType.hunter_irrigation,
        status,
        clientId: client.id,
        city: client.city,
        totalPrice: calc.total,
        gpCommission: calc.gpCommission,
        hunter: {
          create: {
            photo: dto.photo,
            length: dto.length,
            width: dto.width,
            area: calc.area,
            waterSource: dto.waterSource,
            pressure: dto.pressure,
            waterFlow: dto.waterFlow,
            zones: calc.zones,
            sprinklers: calc.sprinklers as Prisma.InputJsonValue,
            pipes: calc.pipes as Prisma.InputJsonValue,
            valves: calc.valves as Prisma.InputJsonValue,
            controller: calc.controller as Prisma.InputJsonValue,
            estimate: calc.estimate as Prisma.InputJsonValue,
            drawing2D: calc.drawing2D as Prisma.InputJsonValue,
          },
        },
      },
      include: { hunter: true },
    });
  }

  async createFurniture(userId: string, dto: {
    photo?: string; roomWidth: number; roomHeight: number; furnitureLength: number;
    furnitureDepth: number; material: string; facadeMaterial: string; color: string; submit?: boolean;
  }) {
    const client = await this.clientProfileId(userId);
    const calc = this.calcFurniture(dto);
    const status = dto.submit ? ServiceProjectStatus.submitted : ServiceProjectStatus.draft;

    const project = await this.prisma.serviceProject.create({
      data: {
        type: ServiceProjectType.furniture,
        status,
        clientId: client.id,
        city: client.city,
        totalPrice: calc.total,
        gpCommission: calc.gpCommission,
        furniture: {
          create: {
            photo: dto.photo,
            roomWidth: dto.roomWidth,
            roomHeight: dto.roomHeight,
            furnitureLength: dto.furnitureLength,
            furnitureDepth: dto.furnitureDepth,
            material: dto.material,
            facadeMaterial: dto.facadeMaterial,
            color: dto.color,
            modules: calc.modules,
            parts: calc.parts as Prisma.InputJsonValue,
            hardware: calc.hardware as Prisma.InputJsonValue,
            estimate: calc.estimate as Prisma.InputJsonValue,
            drawing2D: calc.drawing2D as Prisma.InputJsonValue,
          },
        },
      },
      include: { furniture: true, client: { include: { user: true } } },
    });

    if (dto.submit) {
      const u = project.client.user;
      await this.furnitureExecutor.createFromFurnitureProject(project.id, {
        name: u.name,
        phone: u.phone,
        city: project.city || client.city,
      });
    }

    return project;
  }

  private calcHunter(dto: { length: number; width: number }, linked: { name: string; price: Prisma.Decimal }[]) {
    const length = dto.length;
    const width = dto.width;
    const area = length * width;
    const zones = Math.max(1, Math.ceil(area / 40));
    const sprinklers = { count: zones * 2, item: linked[0]?.name || 'Hunter MP2000' };
    const estimate = {
      lines: [
        { name: sprinklers.item, qty: sprinklers.count, price: Number(linked[0]?.price || 4200) },
        { name: 'Монтаж GP', qty: 1, price: Math.round(area * 1200) },
      ],
    };
    const total = estimate.lines.reduce((s, l) => s + l.qty * l.price, 0);
    return {
      area,
      zones,
      sprinklers,
      pipes: [],
      valves: [],
      controller: { name: 'Hunter X2' },
      estimate,
      drawing2D: { length, width, zones },
      total,
      gpCommission: Math.round(total * 0.1),
    };
  }

  private calcFurniture(dto: {
    roomWidth: number; roomHeight: number; furnitureLength: number; furnitureDepth: number;
    material: string; facadeMaterial: string;
  }) {
    const modules = Math.max(2, Math.ceil(dto.furnitureLength / 0.8));
    const total = Math.round(dto.furnitureLength * 45000 + modules * 8000);
    return {
      modules,
      parts: [],
      hardware: [],
      estimate: { total },
      drawing2D: dto,
      total,
      gpCommission: Math.round(total * 0.08),
    };
  }
}
