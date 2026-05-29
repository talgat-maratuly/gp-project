import { Injectable } from '@nestjs/common';
import { AccountStatus, AccountStatusChangeType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatusService } from './account-status.service';
import { AccountStatusAuditService } from './account-status-audit.service';
import {
  AUTO_MODERATION_RULES,
  AUTO_MODERATION_THRESHOLDS,
} from './auto-moderation.rules';

export type AutoModerationResult = {
  applied: boolean;
  newStatus?: AccountStatus;
  rule?: string;
  reason?: string;
};

@Injectable()
export class AutoModerationService {
  constructor(
    private prisma: PrismaService,
    private accountStatus: AccountStatusService,
    private audit: AccountStatusAuditService,
  ) {}

  async evaluateUser(userId: string): Promise<AutoModerationResult[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partnerProfile: true },
    });
    if (!user || user.accountStatus === AccountStatus.BANNED) return [];

    const results: AutoModerationResult[] = [];

    const complaint24h = await this.countComplaints(userId, 24);
    if (complaint24h >= AUTO_MODERATION_THRESHOLDS.complaints24h) {
      results.push(
        await this.applyIfNeeded(
          userId,
          AccountStatus.SUSPENDED,
          AUTO_MODERATION_RULES.AUTO_COMPLAINT_LIMIT_24H,
          `Too many complaints: ${complaint24h} within 24 hours`,
        ),
      );
    }

    const complaint7d = await this.countComplaints(userId, 24 * 7);
    if (complaint7d >= AUTO_MODERATION_THRESHOLDS.complaints7d) {
      results.push(
        await this.applyIfNeeded(
          userId,
          AccountStatus.SUSPENDED,
          AUTO_MODERATION_RULES.AUTO_COMPLAINT_LIMIT_7D,
          `Too many complaints: ${complaint7d} within 7 days`,
        ),
      );
    }

    const orders1h = await this.countRecentOrders(userId, 1);
    if (orders1h >= AUTO_MODERATION_THRESHOLDS.orders1h) {
      results.push(
        await this.applyIfNeeded(
          userId,
          AccountStatus.SUSPENDED,
          AUTO_MODERATION_RULES.AUTO_SUSPICIOUS_ACTIVITY,
          `Suspicious activity: ${orders1h} orders in 1 hour`,
        ),
      );
    }

    const partner = user.partnerProfile;
    if (partner) {
      const balance = Number(partner.balance);
      if (balance < -5000) {
        results.push(
          await this.applyIfNeeded(
            userId,
            AccountStatus.SUSPENDED,
            AUTO_MODERATION_RULES.AUTO_PAYMENT_DEBT,
            'Platform commission debt exceeds limit',
          ),
        );
      }
    }

    const suspensions30d = await this.audit.countSuspensionsInDays(userId, 30);
    if (suspensions30d >= AUTO_MODERATION_THRESHOLDS.suspensions30d) {
      results.push(
        await this.applyIfNeeded(
          userId,
          AccountStatus.BANNED,
          AUTO_MODERATION_RULES.AUTO_REPEAT_SUSPENSIONS,
          `${suspensions30d} suspensions within 30 days`,
        ),
      );
    }

    const fakeAccounts = await this.detectDuplicateAccounts(user.id, user.phone);
    if (fakeAccounts >= 2) {
      results.push(
        await this.applyIfNeeded(
          userId,
          AccountStatus.BANNED,
          AUTO_MODERATION_RULES.AUTO_MULTIPLE_FAKE_ACCOUNTS,
          'Multiple accounts linked to same phone pattern',
        ),
      );
    }

    return results.filter((r) => r.applied);
  }

  async runScheduledScan(limit = 100): Promise<{ scanned: number; actions: number }> {
    const candidates = await this.prisma.user.findMany({
      where: { accountStatus: AccountStatus.ACTIVE },
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    let actions = 0;
    for (const { id } of candidates) {
      const results = await this.evaluateUser(id);
      actions += results.length;
    }
    return { scanned: candidates.length, actions };
  }

  private async applyIfNeeded(
    userId: string,
    targetStatus: AccountStatus,
    rule: string,
    reason: string,
  ): Promise<AutoModerationResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { applied: false };

    if (targetStatus === AccountStatus.SUSPENDED && user.accountStatus !== AccountStatus.ACTIVE) {
      return { applied: false };
    }
    if (targetStatus === AccountStatus.BANNED && user.accountStatus === AccountStatus.BANNED) {
      return { applied: false };
    }

    await this.accountStatus.transition({
      targetUserId: userId,
      newStatus: targetStatus,
      reason,
      changeType: AccountStatusChangeType.AUTO,
      rule,
      changedById: null,
      skipOperatorCheck: true,
    });

    return { applied: true, newStatus: targetStatus, rule, reason };
  }

  private async countComplaints(userId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.userComplaint.count({
      where: { targetUserId: userId, createdAt: { gte: since } },
    });
  }

  private async countRecentOrders(userId: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const client = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!client) {
      const partner = await this.prisma.partnerProfile.findUnique({ where: { userId } });
      if (!partner) return 0;
      return this.prisma.order.count({
        where: { assignedPartnerId: partner.id, createdAt: { gte: since } },
      });
    }
    return this.prisma.order.count({
      where: { clientId: client.id, createdAt: { gte: since } },
    });
  }

  private async detectDuplicateAccounts(
    userId: string,
    phone: string | null,
  ): Promise<number> {
    if (!phone) return 0;
    const normalized = phone.replace(/\D/g, '').slice(-10);
    if (normalized.length < 10) return 0;
    return this.prisma.user.count({
      where: {
        id: { not: userId },
        phone: { contains: normalized },
        accountStatus: { not: AccountStatus.BANNED },
      },
    });
  }
}
