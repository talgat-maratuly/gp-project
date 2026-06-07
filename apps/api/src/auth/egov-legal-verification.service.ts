import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

export type EgovCheckStatus = 'VERIFIED' | 'REJECTED' | 'UNAVAILABLE';
export type EcpOwnerType = 'DIRECTOR' | 'AUTHORIZED_EMPLOYEE';

export interface EgovCompanyCheckResult {
  status: EgovCheckStatus;
  provider: 'mock' | 'egov';
  checkedAt: Date;
  companyName?: string;
  reason?: string;
}

export interface EgovEcpVerifyResult {
  status: EgovCheckStatus;
  provider: 'mock' | 'egov' | 'ncalayer' | 'egov_mobile';
  checkedAt: Date;
  subject?: string;
  reason?: string;
}

@Injectable()
export class EgovLegalVerificationService {
  private providerMode() {
    return (process.env.EGOV_PROVIDER || 'mock').trim().toLowerCase();
  }

  private assertIdentifier(identifier: string) {
    const value = identifier?.trim();
    if (!value || !/^\d{12}$/.test(value)) {
      throw new BadRequestException('Укажите БИН/ИИН из 12 цифр');
    }
    return value;
  }

  async checkCompany(identifier: string, companyName?: string): Promise<EgovCompanyCheckResult> {
    const binOrIin = this.assertIdentifier(identifier);
    const provider = this.providerMode();
    if (provider === 'mock') {
      return {
        status: 'VERIFIED',
        provider: 'mock',
        checkedAt: new Date(),
        companyName: companyName?.trim() || undefined,
      };
    }

    const url = process.env.EGOV_COMPANY_VERIFY_URL?.trim();
    const token = process.env.EGOV_API_TOKEN?.trim();
    if (!url) {
      return {
        status: 'UNAVAILABLE',
        provider: 'egov',
        checkedAt: new Date(),
        reason: 'EGOV_COMPANY_VERIFY_URL is not configured',
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ identifier: binOrIin, companyName }),
      });
      if (!response.ok) {
        return {
          status: response.status === 404 ? 'REJECTED' : 'UNAVAILABLE',
          provider: 'egov',
          checkedAt: new Date(),
          reason: `eGov response ${response.status}`,
        };
      }
      const data = (await response.json().catch(() => ({}))) as {
        verified?: boolean;
        companyName?: string;
      };
      return {
        status: data.verified === false ? 'REJECTED' : 'VERIFIED',
        provider: 'egov',
        checkedAt: new Date(),
        companyName: data.companyName || companyName?.trim() || undefined,
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        provider: 'egov',
        checkedAt: new Date(),
        reason: 'eGov provider is unavailable',
      };
    }
  }

  async verifyEcpSignature(body: {
    ownerType: EcpOwnerType;
    subject: string;
    identifier?: string;
    signature?: string;
    provider?: 'mock' | 'ncalayer' | 'egov_mobile';
  }): Promise<EgovEcpVerifyResult> {
    if (!['DIRECTOR', 'AUTHORIZED_EMPLOYEE'].includes(body.ownerType)) {
      throw new BadRequestException('ownerType должен быть DIRECTOR или AUTHORIZED_EMPLOYEE');
    }
    const subject = body.subject?.trim();
    if (!subject || subject.length < 8) {
      throw new BadRequestException('Укажите данные субъекта ЭЦП');
    }

    const provider = body.provider || 'mock';
    if (provider === 'mock') {
      return {
        status: 'VERIFIED',
        provider: 'mock',
        checkedAt: new Date(),
        subject,
      };
    }

    if (!body.signature?.trim()) {
      throw new BadRequestException('Для NCALayer/eGov Mobile нужна подпись ЭЦП');
    }

    const url =
      provider === 'egov_mobile'
        ? process.env.EGOV_MOBILE_ECP_VERIFY_URL?.trim()
        : process.env.NCALAYER_VERIFY_URL?.trim();
    if (!url) {
      throw new ServiceUnavailableException('Провайдер ЭЦП не настроен');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerType: body.ownerType,
          subject,
          identifier: body.identifier,
          signature: body.signature,
        }),
      });
      if (!response.ok) {
        return {
          status: response.status === 400 ? 'REJECTED' : 'UNAVAILABLE',
          provider,
          checkedAt: new Date(),
          reason: `ECP provider response ${response.status}`,
        };
      }
      const data = (await response.json().catch(() => ({}))) as { verified?: boolean };
      return {
        status: data.verified === false ? 'REJECTED' : 'VERIFIED',
        provider,
        checkedAt: new Date(),
        subject,
      };
    } catch {
      return {
        status: 'UNAVAILABLE',
        provider,
        checkedAt: new Date(),
        reason: 'ECP provider is unavailable',
      };
    }
  }
}
