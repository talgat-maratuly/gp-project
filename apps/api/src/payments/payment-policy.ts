import { OrderCategory, PaymentMethod } from '@prisma/client';

export type PaymentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type PaymentPolicy = {
  category: OrderCategory;
  allowedMethods: PaymentMethod[];
  settlementModel: 'DIRECT_TO_PARTNER' | 'GP_COMMISSION_BALANCE' | 'FUTURE_ESCROW';
  commissionTrigger: 'ORDER_COMPLETED' | 'LEGAL_DOCUMENT_SIGNED' | 'MANUAL_ADMIN_REVIEW';
  requiresLegalSignature: boolean;
  riskLevel: PaymentRiskLevel;
};

const DEFAULT_POLICY: Omit<PaymentPolicy, 'category'> = {
  allowedMethods: [PaymentMethod.CASH_ON_DELIVERY, PaymentMethod.KASPI_DIRECT_TO_PARTNER],
  settlementModel: 'GP_COMMISSION_BALANCE',
  commissionTrigger: 'ORDER_COMPLETED',
  requiresLegalSignature: false,
  riskLevel: 'LOW',
};

const POLICY_BY_CATEGORY: Partial<Record<OrderCategory, Omit<PaymentPolicy, 'category'>>> = {
  [OrderCategory.SHOP]: {
    ...DEFAULT_POLICY,
    riskLevel: 'MEDIUM',
  },
  [OrderCategory.AUTOWATERING]: {
    ...DEFAULT_POLICY,
    requiresLegalSignature: true,
    commissionTrigger: 'LEGAL_DOCUMENT_SIGNED',
    riskLevel: 'MEDIUM',
  },
  [OrderCategory.ELECTRICAL]: {
    ...DEFAULT_POLICY,
    requiresLegalSignature: true,
    commissionTrigger: 'MANUAL_ADMIN_REVIEW',
    riskLevel: 'MEDIUM',
  },
};

export function paymentPolicyForCategory(category: OrderCategory): PaymentPolicy {
  return {
    category,
    ...(POLICY_BY_CATEGORY[category] ?? DEFAULT_POLICY),
  };
}

export function paymentPolicies() {
  return Object.values(OrderCategory).map(paymentPolicyForCategory);
}
