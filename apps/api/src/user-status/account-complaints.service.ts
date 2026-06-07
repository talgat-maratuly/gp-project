import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutoModerationService } from './auto-moderation.service';

@Injectable()
export class AccountComplaintsService {
  constructor(
    private prisma: PrismaService,
    private autoModeration: AutoModerationService,
  ) {}

  async fileComplaint(
    targetUserId: string,
    reason: string,
    reporterUserId?: string,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('Пайдаланушы табылмады');

    const complaint = await this.prisma.userComplaint.create({
      data: {
        targetUserId,
        reporterUserId: reporterUserId ?? null,
        regionId: target.regionId,
        reason: reason.trim(),
      },
    });

    const autoResults = await this.autoModeration.evaluateUser(targetUserId);

    return { complaint, autoModeration: autoResults };
  }

  async countForUser(targetUserId: string, hours?: number) {
    const since = hours
      ? new Date(Date.now() - hours * 60 * 60 * 1000)
      : undefined;
    return this.prisma.userComplaint.count({
      where: {
        targetUserId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });
  }
}
