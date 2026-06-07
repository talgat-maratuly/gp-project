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
    pressure: number; waterFlow: number; submit?: boolean; shape?: string; sotki?: number;
    objects?: Record<string, unknown>[]; points?: Record<string, unknown>[]; drawing?: Record<string, unknown>;
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
            shape: calc.shape,
            lotAreaSotka: calc.lotAreaSotka,
            length: dto.length,
            width: dto.width,
            area: calc.area,
            lawnArea: calc.lawnArea,
            noWaterArea: calc.noWaterArea,
            waterSource: dto.waterSource,
            pressure: dto.pressure,
            waterFlow: dto.waterFlow,
            zones: calc.zones,
            zonesPlan: calc.zonesPlan as Prisma.InputJsonValue,
            sprinklers: calc.sprinklers as Prisma.InputJsonValue,
            pipes: calc.pipes as Prisma.InputJsonValue,
            valves: calc.valves as Prisma.InputJsonValue,
            controller: calc.controller as Prisma.InputJsonValue,
            filter: calc.filter as Prisma.InputJsonValue,
            fittings: calc.fittings as Prisma.InputJsonValue,
            pump: calc.pump as Prisma.InputJsonValue,
            materials: calc.materials as Prisma.InputJsonValue,
            market: calc.market as Prisma.InputJsonValue,
            aiChecks: calc.aiChecks as Prisma.InputJsonValue,
            estimate: calc.estimate as Prisma.InputJsonValue,
            drawing2D: calc.drawing2D as Prisma.InputJsonValue,
          } as any,
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

  private calcHunter(dto: {
    length: number; width: number; pressure?: number; waterFlow?: number; shape?: string; sotki?: number;
    objects?: Record<string, unknown>[]; points?: Record<string, unknown>[];
  }, linked: { id: string; name: string; price: Prisma.Decimal; stock: number; inStock: boolean; brand?: string | null; category: string }[]) {
    const n = (v: unknown, fallback: number) => {
      const num = Number(v);
      return Number.isFinite(num) ? num : fallback;
    };
    const length = Math.max(1, n(dto.length, 12));
    const width = Math.max(1, n(dto.width, 8));
    const shape = dto.shape || 'rectangle';
    const grossArea = dto.sotki && dto.sotki > 0
      ? dto.sotki * 100
      : shape === 'circle'
        ? Math.PI * Math.pow(length / 2, 2)
        : shape === 'oval'
          ? Math.PI * (length / 2) * (width / 2)
          : shape === 'triangle'
            ? (length * width) / 2
            : length * width;
    const objects = Array.isArray(dto.objects) ? dto.objects : [];
    const noWaterArea = objects
      .filter((o) => ['house', 'path', 'no_water'].includes(String(o.type || '')))
      .reduce((sum, o) => sum + Math.max(0, n(o.areaSqm, String(o.type) === 'house' ? Math.min(80, grossArea * 0.22) : 8)), 0);
    const area = Math.max(1, Math.round(grossArea - noWaterArea));
    const pressure = Math.max(0.1, n(dto.pressure, 2.5));
    const flow = Math.max(0.1, n(dto.waterFlow, 2));
    const sprinklerProduct = linked.find((p) => /hunter|mp|pgp|sprinkler|форсун/i.test(`${p.name} ${p.brand || ''}`));
    const sprinkler = {
      name: sprinklerProduct?.name || (pressure < 2.1 ? 'Hunter PSU-200' : area > 180 ? 'Hunter PGP-04' : 'Hunter MP Rotator 2000'),
      price: Number(sprinklerProduct?.price || (area > 180 ? 6800 : 4200)),
      radiusM: area > 180 ? 6 : pressure < 2.1 ? 3 : 4,
      flowM3h: area > 180 ? 0.55 : 0.18,
      minPressureBar: area > 180 ? 2.5 : 2.1,
      productId: sprinklerProduct?.id,
    };
    const sprinklerCoverage = Math.max(8, Math.PI * sprinkler.radiusM * sprinkler.radiusM * 0.55);
    const sprinklerCount = Math.max(2, Math.ceil(area / sprinklerCoverage));
    const maxPerZone = Math.max(1, Math.floor(flow / sprinkler.flowM3h));
    const zones = Math.max(1, Math.ceil(area / 120), Math.ceil(sprinklerCount / maxPerZone));
    const sprinklers = Array.from({ length: sprinklerCount }, (_, i) => ({
      id: `spr-${i + 1}`,
      name: sprinkler.name,
      zone: (i % zones) + 1,
      radiusM: sprinkler.radiusM,
      x: ((i % Math.ceil(Math.sqrt(sprinklerCount))) + 0.5) * (length / Math.ceil(Math.sqrt(sprinklerCount))),
      y: (Math.floor(i / Math.ceil(Math.sqrt(sprinklerCount))) + 0.5) * (width / Math.ceil(sprinklerCount / Math.ceil(Math.sqrt(sprinklerCount)))),
    }));
    const pipeMeters = Math.max(20, Math.round((length + width) * 2 + sprinklerCount * sprinkler.radiusM * 1.15 + zones * 8));
    const needsPump = pressure < sprinkler.minPressureBar || flow < (sprinklerCount * sprinkler.flowM3h) / zones;
    const pipe = { name: 'Труба ПНД 25 мм', unit: 'м', qty: pipeMeters, price: 450, type: 'pipe' };
    const valves = [{ name: 'Клапан Hunter PGV', qty: zones, price: 8500, type: 'valve' }];
    const controller = { name: `Контроллер Hunter X2 ${zones <= 4 ? 4 : zones <= 6 ? 6 : 8} зон`, qty: 1, price: 28500, type: 'controller' };
    const filter = { name: 'Фильтр 120 mesh для автополива', qty: 1, price: 18000, type: 'filter' };
    const fittings = { name: 'Фитинги ПНД 25 мм', qty: Math.max(10, sprinklerCount * 2 + zones * 3), price: 1200, type: 'fitting' };
    const pump = needsPump ? { name: 'Насос для автополива', qty: 1, price: 65000, type: 'pump' } : null;
    const materialLines = [
      { name: sprinkler.name, qty: sprinklerCount, price: sprinkler.price, type: 'sprinkler', productId: sprinkler.productId },
      pipe,
      ...valves,
      controller,
      filter,
      fittings,
      ...(pump ? [pump] : []),
    ];
    const market = materialLines.map((line) => {
      const productId = (line as any).productId;
      const found = linked.find((p) => productId === p.id || line.name.toLowerCase().split(/\s+/).some((w) => w.length > 3 && p.name.toLowerCase().includes(w)));
      const stock = found?.stock || 0;
      return {
        ...line,
        market: found
          ? { status: stock >= line.qty ? 'available' : stock > 0 ? 'partial' : 'missing', productId: found.id, productName: found.name, price: Number(found.price), quantity: stock, storeName: 'GP Market', requestToShop: stock < line.qty }
          : { status: 'missing', message: 'нет в наличии', requestToShop: true },
      };
    });
    const aiChecks = [
      ...(objects.some((o) => String(o.type) === 'water_point') ? [] : [{ level: 'warning', code: 'water_point_missing', message: 'Не указана точка подключения воды.' }]),
      ...(pressure < sprinkler.minPressureBar ? [{ level: 'error', code: 'low_pressure', message: 'Давления не хватает, нужен насос или другие форсунки.' }] : []),
      ...(Math.ceil(sprinklerCount / maxPerZone) > Math.ceil(area / 120) ? [{ level: 'warning', code: 'low_flow', message: 'Расход воды ограничивает зону, расчёт разделён на дополнительные зоны.' }] : []),
    ];
    if (!aiChecks.length) aiChecks.push({ level: 'ok', code: 'mvp_ok', message: 'MVP-проверка без критичных ошибок. Подтвердит специалист.' });
    const estimate = { lines: [...market, { name: 'Проверка и монтаж специалистом GP', qty: 1, price: Math.round(area * 1100), type: 'labor' }] };
    const total = estimate.lines.reduce((s, l) => s + Number(l.qty || 1) * Number((l as any).market?.price || l.price || 0), 0);
    return {
      shape,
      lotAreaSotka: Number((grossArea / 100).toFixed(2)),
      area,
      lawnArea: area,
      noWaterArea: Math.round(noWaterArea),
      zones,
      zonesPlan: Array.from({ length: zones }, (_, i) => ({ id: `zone-${i + 1}`, name: `Зона ${i + 1}`, areaSqm: Math.round(area / zones), sprinklers: sprinklers.filter((s) => s.zone === i + 1).length })),
      sprinklers,
      pipes: [pipe],
      valves,
      controller,
      filter,
      fittings,
      pump,
      materials: market,
      market,
      aiChecks,
      estimate: { ...estimate, subtotal: total, gpCommission: Math.round(total * 0.1), total },
      drawing2D: { shape, length, width, zones, grossArea: Math.round(grossArea), lawnArea: area, noWaterArea: Math.round(noWaterArea), objects, sprinklers: sprinklers.map((s) => ({ x: s.x, y: s.y, zone: s.zone, radiusM: s.radiusM })) },
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
