import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderCategory } from '@prisma/client';
import { calcOrderCommission } from '../common/commission.util';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDERS } from './payment-provider.registry';
import { paymentPolicies, paymentPolicyForCategory } from './payment-policy';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /** GP не хранит деньги клиента — оплата напрямую партнёру */
  getPaymentArchitecture() {
    return {
      methods: ['CASH_ON_DELIVERY', 'KASPI_DIRECT_TO_PARTNER'],
      model: 'GP_BALANCE_COMMISSION',
      description:
        'Клиент платит партнёру напрямую. GP списывает сервисную комиссию с баланса партнёра после COMPLETED.',
      septicCommission: {
        '3-4m3': 300,
        '5m3': 300,
        '6m3': 400,
        '7-10m3': 500,
      },
      lawnCommission: 1000,
      consultationFee: 2000,
      consultationCommission: 1000,
      providers: PAYMENT_PROVIDERS,
      policies: paymentPolicies(),
    };
  }

  previewCommission(category: OrderCategory, septicVolume?: number, serviceId?: string) {
    const policy = paymentPolicyForCategory(category);
    return {
      category,
      septicVolume: septicVolume ?? null,
      serviceId: serviceId ?? null,
      commission: calcOrderCommission(category, { septicVolume, serviceId }),
      currency: 'KZT',
      paymentPolicy: policy,
    };
  }

  providers() {
    return PAYMENT_PROVIDERS;
  }

  policies() {
    return paymentPolicies();
  }

  async orderPolicy(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        category: true,
        serviceId: true,
        serviceName: true,
        total: true,
        paymentMethod: true,
        paymentStatus: true,
        septicVolume: true,
        gpCommission: true,
        commissionPaid: true,
        status: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const calculatedCommission = calcOrderCommission(order.category, {
      septicVolume: order.septicVolume ?? undefined,
      serviceId: order.serviceId ?? undefined,
    });
    return {
      order,
      providerCandidates: PAYMENT_PROVIDERS.filter((provider) => provider.status !== 'DISABLED'),
      paymentPolicy: paymentPolicyForCategory(order.category),
      calculatedCommission,
      commissionToCharge: Number(order.gpCommission ?? calculatedCommission),
      currency: 'KZT',
    };
  }
}
