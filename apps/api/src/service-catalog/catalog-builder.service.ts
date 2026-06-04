import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertLocalizedNames } from './service-catalog.types';

/** Клиент/demo store форматына аудару — cityCatalog.js үйлесімді */
@Injectable()
export class CatalogBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildForFranchise(franchiseId: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id: franchiseId },
    });
    if (!franchise?.cityId) return [];

    return this.buildForCity(franchise.cityId, franchiseId);
  }

  async buildForCity(cityId: string, franchiseId?: string) {
    const prices = await this.prisma.cityServicePrice.findMany({
      where: { cityId },
      include: {
        serviceType: {
          include: { subserviceTypes: { orderBy: { sortOrder: 'asc' } } },
        },
        subserviceType: true,
      },
      orderBy: [{ priority: 'asc' }, { volumeStart: 'asc' }],
    });

    if (!prices.length) return [];

    const byService = new Map<string, typeof prices>();
    for (const p of prices) {
      const key = p.serviceTypeId;
      if (!byService.has(key)) byService.set(key, []);
      byService.get(key)!.push(p);
    }

    const services: Array<Record<string, unknown>> = [];
    for (const [, rows] of byService) {
      const st = rows[0].serviceType;
      const names = assertLocalizedNames(st.names);
      const activeRows = rows.filter((r) => r.active);
      const active = st.active && activeRows.length > 0;

      const subMap = new Map<string, (typeof rows)[0]>();
      for (const r of rows) {
        if (r.subserviceTypeId) subMap.set(r.subserviceTypeId, r);
      }

      const subservices: Array<{
        id: string;
        subserviceTypeId: string;
        code: string;
        names: ReturnType<typeof assertLocalizedNames>;
        name: string;
        price: number;
        gpCommission: number;
        active: boolean;
        volumeStart: number | null;
        volumeEnd: number | null;
        priority: number;
      }> = [];

      for (const subType of st.subserviceTypes) {
        const priceRow = subMap.get(subType.id);
        if (!priceRow) continue;
        const subNames = assertLocalizedNames(subType.names);
        subservices.push({
          id: priceRow.id,
          subserviceTypeId: subType.id,
          code: subType.code,
          names: subNames,
          name: subNames.ru,
          price: priceRow.price,
          gpCommission: priceRow.gpCommission,
          active: priceRow.active && subType.active,
          volumeStart: priceRow.volumeStart,
          volumeEnd: priceRow.volumeEnd,
          priority: priceRow.priority,
        });
      }

      const activeSubs = subservices.filter((s) => s.active !== false);
      const minPrice = activeSubs.length
        ? Math.min(...activeSubs.map((s) => s.price))
        : 0;

      services.push({
        id: `${st.code}_${franchiseId || cityId}`,
        templateId: st.code,
        franchiseId: franchiseId || rows[0].franchiseId,
        cityId,
        names,
        name: names.ru,
        basePrice: Number.isFinite(minPrice) ? minPrice : 0,
        gpCommission: subservices[0]?.gpCommission ?? 0,
        active,
        subservices,
      });
    }

    return services;
  }
}
