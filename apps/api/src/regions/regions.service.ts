import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        select: { cityId: true, city: true, regionId: true },
        orderBy: { city: 'asc' },
      }),
      this.prisma.cityServicePrice.findMany({
        distinct: ['cityId'],
        select: { cityId: true, oblastId: true },
        orderBy: { cityId: 'asc' },
      }),
    ]);

    const byId = new Map<string, { id: string; name: string; regionId: string | null }>();
    for (const f of franchises) {
      const id = f.cityId || f.city;
      if (!id) continue;
      byId.set(id, { id, name: f.city || id, regionId: f.regionId ?? null });
    }
    for (const c of priceCities) {
      if (!c.cityId || byId.has(c.cityId)) continue;
      byId.set(c.cityId, { id: c.cityId, name: c.cityId, regionId: c.oblastId ?? null });
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  findByCode(code: string) {
    return this.prisma.region.findUnique({ where: { code } });
  }
}
