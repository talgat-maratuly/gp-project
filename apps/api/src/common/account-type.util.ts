import { BadRequestException } from '@nestjs/common';
import { AccountType } from '@prisma/client';

export const PARTNER_DOCUMENT_KINDS = [
  'ID_CARD',
  'IIN',
  'BIN_CERTIFICATE',
  'COMPANY_REGISTRATION',
  'POWER_OF_ATTORNEY',
  'OTHER',
] as const;

export type PartnerDocumentItem = {
  kind: string;
  number?: string;
  note?: string;
};

export function normalizePartnerDocuments(raw: unknown): PartnerDocumentItem[] | undefined {
  if (!raw) return undefined;
  if (!Array.isArray(raw)) throw new BadRequestException('documents должен быть массивом');
  return raw.map((item, i) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException(`documents[${i}]: некорректный формат`);
    }
    const kind = String((item as PartnerDocumentItem).kind || '').trim();
    if (!kind) throw new BadRequestException(`documents[${i}]: укажите kind`);
    return {
      kind,
      number: (item as PartnerDocumentItem).number?.trim() || undefined,
      note: (item as PartnerDocumentItem).note?.trim() || undefined,
    };
  });
}

export function validateClientRegistration(opts: {
  accountType: AccountType;
  name: string;
  companyName?: string;
  bin?: string;
  legalAddress?: string;
}) {
  if (opts.accountType === AccountType.LEGAL_ENTITY) {
    if (!opts.companyName?.trim()) throw new BadRequestException('Укажите наименование организации');
    if (!opts.bin?.trim()) throw new BadRequestException('Укажите БИН');
    if (!opts.legalAddress?.trim()) throw new BadRequestException('Укажите юридический адрес');
  } else if (!opts.name?.trim()) {
    throw new BadRequestException('Укажите ФИО');
  }
}

export function validatePartnerRegistration(opts: {
  accountType: AccountType;
  name: string;
  company?: string;
  bin?: string;
  legalAddress?: string;
  idDocumentNumber?: string;
  documents?: PartnerDocumentItem[];
}) {
  if (opts.accountType === AccountType.LEGAL_ENTITY) {
    if (!opts.company?.trim()) throw new BadRequestException('Укажите название компании');
    if (!opts.bin?.trim()) throw new BadRequestException('Укажите БИН');
    if (!opts.legalAddress?.trim()) throw new BadRequestException('Укажите юридический адрес');
    const docs = opts.documents || [];
    if (!docs.some((d) => d.kind === 'BIN_CERTIFICATE' || d.kind === 'COMPANY_REGISTRATION')) {
      throw new BadRequestException('Для юрлица укажите документ: BIN_CERTIFICATE или COMPANY_REGISTRATION');
    }
  } else {
    if (!opts.name?.trim()) throw new BadRequestException('Укажите ФИО');
    // Документы можно дополнить в профиле после onboarding
  }
}
