import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CITY_LABELS: Record<string, string> = {
  'city-uralsk': 'Уральск',
  'city-aksay': 'Аксай',
  'city-atyrau': 'Атырау',
  'city-aktobe': 'Актобе',
  'city-almaty': 'Алматы',
  'city-astana': 'Астана',
};

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  listActive() {
    return this.prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, isActive: true },
    });
  }

  async listCities() {
    const [franchises, priceCities] = await Promise.all([
      this.prisma.franchise.findMany({
        where: { isActive: true },
        select: { id: true, cityId: true, city: true, regionId: true },
        orderBy: { city: 'asc' },
      }),
      this.prisma.cityServicePrice.findMany({
        distinct: ['cityId'],
        select: { cityId: true, franchiseId: true },
        orderBy: { cityId: 'asc' },
      }),
    ]);

    const byId = new Map<string, { id: string; name: string; regionId: string | null }>();
    const franchiseRegionById = new Map(franchises.map((f) => [f.id, f.regionId ?? null]));
    for (const f of franchises) {
      const id = f.cityId || f.city;
      if (!id) continue;
      byId.set(id, { id, name: f.city || id, regionId: f.regionId ?? null });
    }
    for (const c of priceCities) {
      if (!c.cityId || byId.has(c.cityId)) continue;
      byId.set(c.cityId, {
        id: c.cityId,
        name: CITY_LABELS[c.cityId] || c.cityId,
        regionId: c.franchiseId ? franchiseRegionById.get(c.franchiseId) ?? null : null,
      });
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  findByCode(code: string) {
    return this.prisma.region.findUnique({ where: { code } });
  }
}
