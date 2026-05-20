import { Injectable } from '@nestjs/common';
import { OrderCategory } from '@prisma/client';
import { calcOrderCommission } from '../common/commission.util';

@Injectable()
export class PaymentsService {
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
    };
  }

  previewCommission(category: OrderCategory, septicVolume?: number, serviceId?: string) {
    return {
      category,
      septicVolume: septicVolume ?? null,
      serviceId: serviceId ?? null,
      commission: calcOrderCommission(category, { septicVolume, serviceId }),
      currency: 'KZT',
    };
  }
}
