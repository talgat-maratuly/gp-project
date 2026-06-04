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

const SERVICE_CODE_TO_MAIN: Record<string, string> = {
  septic: 'SEPTIC',
  lawn: 'LAWN',
  irrigation: 'AUTOWATERING',
  filter: 'FILTERS',
  other: 'OTHER',
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
      where: {
        cityId,
        active: true,
        serviceType: { active: true },
        subserviceTypeId: { not: null },
        subserviceType: { active: true },
      },
      include: {
        serviceType: true,
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
      if (!st.active) continue;
      const names = assertLocalizedNames(st.names);

      const subservices = rows
        .filter((priceRow) => priceRow.subserviceType?.active)
        .map((priceRow) => {
          const subType = priceRow.subserviceType!;
          const subNames = assertLocalizedNames(subType.names);
          return {
            id: priceRow.id,
            subserviceTypeId: subType.id,
            code: subType.code,
            names: subNames,
            name: subNames.ru,
            price: priceRow.price,
            gpCommission: priceRow.gpCommission,
            active: true,
            volumeStart: priceRow.volumeStart,
            volumeEnd: priceRow.volumeEnd,
            priority: priceRow.priority,
          };
        });

      if (!subservices.length) continue;

      const minPrice = Math.min(...subservices.map((s) => s.price));

      services.push({
        id: `${st.code}_${franchiseId || cityId}`,
        templateId: st.code,
        franchiseId: franchiseId || rows[0].franchiseId,
        cityId,
        names,
        name: names.ru,
        basePrice: Number.isFinite(minPrice) ? minPrice : 0,
        gpCommission: subservices[0]?.gpCommission ?? 0,
        active: true,
        subservices,
      });
    }

    return services;
  }

  /** Қалада active негізгі қызмет идентификаторлары (SEPTIC, LAWN, …) */
  async getOnboardingMainServices(cityId: string) {
    if (!cityId?.trim()) return [];
    const prices = await this.prisma.cityServicePrice.findMany({
      where: {
        cityId: cityId.trim(),
        active: true,
        subserviceTypeId: { not: null },
        subserviceType: { active: true },
        serviceType: { active: true },
      },
      include: { serviceType: { select: { code: true } } },
    });
    const mains = new Set<string>();
    for (const p of prices) {
      const main = SERVICE_CODE_TO_MAIN[p.serviceType.code];
      if (main) mains.add(main);
    }
    return [...mains];
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

  async resolveFranchiseIdForCity(cityId: string) {
    const fr = await this.prisma.franchise.findFirst({ where: { cityId: cityId.trim() } });
    return fr?.id ?? null;
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
