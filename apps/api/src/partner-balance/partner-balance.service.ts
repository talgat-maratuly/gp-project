import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BalanceTransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class PartnerBalanceService {
  constructor(
    private prisma: PrismaService,
    private partners: PartnersService,
  ) {}

  async getBalance(userId: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    return { balance: profile.balance, partnerId: profile.id };
  }

  async getTransactions(userId: string) {
    const profile = await this.partners.ensurePartnerProfile(userId);
    return this.prisma.balanceTransaction.findMany({
      where: { partnerId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async topup(userId: string, amount: number, note?: string) {
    if (amount < 100) throw new BadRequestException('Минимум 100 ₸');
    const profile = await this.partners.ensurePartnerProfile(userId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.partnerProfile.update({
        where: { id: profile.id },
        data: { balance: { increment: amount } },
      });
      await tx.balanceTransaction.create({
        data: {
          partnerId: profile.id,
          type: BalanceTransactionType.TOPUP,
          amount,
          note: note || 'Пополнение баланса',
        },
      });
      return p;
    });
    return { balance: updated.balance };
  }

  async chargeCommission(partnerId: string, orderId: string, amount: number, note: string) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { id: partnerId } });
    if (!profile) throw new NotFoundException('Партнёр не найден');
    const newBalance = Number(profile.balance) - amount;
    await this.prisma.$transaction([
      this.prisma.partnerProfile.update({
        where: { id: partnerId },
        data: { balance: Math.max(0, newBalance) },
      }),
      this.prisma.balanceTransaction.create({
        data: {
          partnerId,
          type: BalanceTransactionType.COMMISSION,
          amount: -amount,
          orderId,
          note,
        },
      }),
    ]);
  }
}
