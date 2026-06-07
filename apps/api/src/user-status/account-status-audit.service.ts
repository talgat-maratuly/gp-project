import { Injectable } from '@nestjs/common';
import {
  AccountStatus,
  AccountStatusChangeType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type WriteAccountStatusLogInput = {
  userId: string;
  oldStatus: AccountStatus;
  newStatus: AccountStatus;
  changeType: AccountStatusChangeType;
  reason: string;
  rule?: string | null;
  changedById?: string | null;
};

@Injectable()
export class AccountStatusAuditService {
  constructor(private prisma: PrismaService) {}

  async writeLog(input: WriteAccountStatusLogInput) {
    return this.prisma.accountStatusLog.create({
      data: {
        userId: input.userId,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
        changeType: input.changeType,
        reason: input.reason,
        rule: input.rule ?? null,
        changedById: input.changedById ?? null,
      },
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listForUser(userId: string, take = 50) {
    return this.prisma.accountStatusLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        changedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listModerator(
    where: Prisma.AccountStatusLogWhereInput,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.accountStatusLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              regionId: true,
              accountStatus: true,
            },
          },
          changedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.accountStatusLog.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async countSuspensionsInDays(userId: string, days: number): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.prisma.accountStatusLog.count({
      where: {
        userId,
        newStatus: AccountStatus.SUSPENDED,
        createdAt: { gte: since },
      },
    });
  }
}
