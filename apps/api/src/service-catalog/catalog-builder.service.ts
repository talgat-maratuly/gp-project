import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertLocalizedNames } from './service-catalog.types';


const MAIN_SERVICE_TO_CODE: Record<string, string> = {
  SEPTIC: 'septic',
  LAWN: 'lawn',
  AUTOWATERING: 'irrigation',
  FILTERS: 'filter',
  OTHER: 'other',
};

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

  /** Маман тіркелу: қалада active подуслугалар */
  async getOnboardingSubservices(cityId: string, mainServiceId: string) {
    const serviceCode = MAIN_SERVICE_TO_CODE[mainServiceId];
    if (!serviceCode || !cityId?.trim()) return [];

    const prices = await this.prisma.cityServicePrice.findMany({
      where: {
        cityId: cityId.trim(),
        active: true,
        subserviceTypeId: { not: null },
        subserviceType: { active: true },
        serviceType: { code: serviceCode, active: true },
      },
      include: {
        subserviceType: true,
        serviceType: true,
      },
      orderBy: [{ priority: 'asc' }, { volumeStart: 'asc' }],
    });

    return prices
      .filter((p) => p.subserviceType)
      .map((p) => {
        const sub = p.subserviceType!;
        const names = assertLocalizedNames(sub.names);
        return {
          id: sub.code,
          subserviceTypeId: sub.id,
          serviceCode,
          label: names.ru,
          names,
          price: p.price,
          volumeStart: p.volumeStart,
          volumeEnd: p.volumeEnd,
        };
      });
  }

  async resolveCityId(cityId?: string | null, cityName?: string | null, franchiseId?: string | null) {
    if (cityId?.trim()) return cityId.trim();
    if (franchiseId) {
      const fr = await this.prisma.franchise.findUnique({ where: { id: franchiseId } });
      if (fr?.cityId) return fr.cityId;
    }
    if (cityName?.trim()) {
      const fr = await this.prisma.franchise.findFirst({
        where: { city: { equals: cityName.trim(), mode: 'insensitive' } },
      });
      if (fr?.cityId) return fr.cityId;
    }
    return null;
  }
}
