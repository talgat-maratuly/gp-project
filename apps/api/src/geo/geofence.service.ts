import { Injectable } from '@nestjs/common';
import { GeofenceZoneType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { inGeofenceZone } from '../common/geofence.util';

@Injectable()
export class GeofenceService {
  constructor(private prisma: PrismaService) {}

  async listActive(city = 'Уральск') {
    return this.prisma.geofenceZone.findMany({
      where: { active: true, city },
      orderBy: { name: 'asc' },
    });
  }

  async listOfficialDisposals(city = 'Уральск') {
    return this.prisma.geofenceZone.findMany({
      where: {
        active: true,
        city,
        type: GeofenceZoneType.SEPTIC_DISPOSAL,
        isOfficial: true,
      },
    });
  }

  findZoneAt(lat: number, lng: number, zones: Awaited<ReturnType<typeof this.listActive>>) {
    return zones.find((z) => inGeofenceZone(lat, lng, z)) ?? null;
  }

  findOfficialDisposalAt(lat: number, lng: number, zones: Awaited<ReturnType<typeof this.listOfficialDisposals>>) {
    return zones.find((z) => inGeofenceZone(lat, lng, z)) ?? null;
  }
}
