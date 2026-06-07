export type PaymentProviderStatus = 'READY' | 'PLANNED' | 'DISABLED';

export type PaymentProviderDescriptor = {
  id: 'cash' | 'kaspi_direct' | 'halyk' | 'card_acquiring' | 'egov_legal';
  title: string;
  status: PaymentProviderStatus;
  moneyFlow: 'DIRECT_PARTNER' | 'GP_PROCESSING' | 'LEGAL_SIGNATURE_ONLY';
  storesSensitivePaymentData: boolean;
  notes: string;
};

export const PAYMENT_PROVIDERS: PaymentProviderDescriptor[] = [
  {
    id: 'cash',
    title: 'Cash / transfer to partner',
    status: 'READY',
    moneyFlow: 'DIRECT_PARTNER',
    storesSensitivePaymentData: false,
    notes: 'Client pays partner directly; GP records order total and charges partner commission from balance.',
  },
  {
    id: 'kaspi_direct',
    title: 'Kaspi direct to partner',
    status: 'READY',
    moneyFlow: 'DIRECT_PARTNER',
    storesSensitivePaymentData: false,
    notes: 'Used as current safe model: GP does not hold client funds.',
  },
  {
    id: 'halyk',
    title: 'Halyk acquiring',
    status: 'PLANNED',
    moneyFlow: 'GP_PROCESSING',
    storesSensitivePaymentData: false,
    notes: 'Future provider adapter; tokenized provider IDs only, no card data in GP database.',
  },
  {
    id: 'card_acquiring',
    title: 'Generic card acquiring',
    status: 'PLANNED',
    moneyFlow: 'GP_PROCESSING',
    storesSensitivePaymentData: false,
    notes: 'Reserved for a PSP integration with webhook verification and reconciliation.',
  },
  {
    id: 'egov_legal',
    title: 'eGov / NCALayer legal signing',
    status: 'PLANNED',
    moneyFlow: 'LEGAL_SIGNATURE_ONLY',
    storesSensitivePaymentData: false,
    notes: 'For company verification, contracts, acts, invoices and legally significant actions.',
  },
];
