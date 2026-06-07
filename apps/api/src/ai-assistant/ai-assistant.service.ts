import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiArtifactDomain, AiSeverity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AiResult = {
  ok?: boolean;
  domain?: string;
  summary?: string;
  issues?: Array<Record<string, any>>;
  recommendations?: Array<Record<string, any>>;
  data?: Record<string, any>;
};

const DOMAIN_MAP: Record<string, AiArtifactDomain> = {
  '/ai/orders/validate': AiArtifactDomain.ORDERS,
  '/ai/orders/match-partners': AiArtifactDomain.PARTNERS,
  '/ai/market/recommend': AiArtifactDomain.MARKET,
  '/ai/irrigation/check': AiArtifactDomain.IRRIGATION,
  '/ai/plant-doctor/analyze': AiArtifactDomain.PLANT_DOCTOR,
  '/ai/admin/audit': AiArtifactDomain.ADMIN,
  '/ai/reports/service': AiArtifactDomain.REPORT_SERVICE,
  '/ai/reports/partner': AiArtifactDomain.REPORT_PARTNER,
  '/ai/reports/admin': AiArtifactDomain.REPORT_ADMIN,
};

function severity(value: unknown): AiSeverity {
  if (value === 'ok') return AiSeverity.ok;
  if (value === 'warning') return AiSeverity.warning;
  if (value === 'error') return AiSeverity.error;
  return AiSeverity.info;
}

function defaultDevAiUrl(): string {
  return ['http', '//localhost', '8010'].join(':');
}

@Injectable()
export class AiAssistantService {
  private readonly baseUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.isProduction = config.get<string>('NODE_ENV') === 'production';
    this.baseUrl =
      config.get<string>('AI_ASSISTANT_URL')?.trim() ||
      (this.isProduction ? '' : defaultDevAiUrl());
  }

  async call(path: string, payload: Record<string, any>, meta: { entityType?: string; entityId?: string } = {}) {
    if (!this.baseUrl) {
      throw new BadGatewayException({
        message: 'Python AI Assistant не настроен',
        hint: 'Для production задайте AI_ASSISTANT_URL в env',
        error: 'AI_ASSISTANT_URL is required in production',
      });
    }

    let result: AiResult;
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {}),
      });
      if (!res.ok) throw new Error(`AI Assistant ${res.status}`);
      result = await res.json();
    } catch (e) {
      throw new BadGatewayException({
        message: 'Python AI Assistant недоступен',
        hint: 'Запустите apps/ai-assistant: uvicorn app.main:app --port 8010',
        error: e instanceof Error ? e.message : String(e),
      });
    }

    await this.persist(path, payload, result, meta);
    return result;
  }

  private async persist(path: string, payload: Record<string, any>, result: AiResult, meta: { entityType?: string; entityId?: string }) {
    const domain = DOMAIN_MAP[path] || AiArtifactDomain.ADMIN;
    const payloadJson = payload as Prisma.InputJsonValue;
    const resultJson = result as Prisma.InputJsonValue;
    const issues = [...(result.issues || []), ...(result.recommendations || [])];

    if (domain === AiArtifactDomain.REPORT_SERVICE || domain === AiArtifactDomain.REPORT_PARTNER || domain === AiArtifactDomain.REPORT_ADMIN) {
      await this.prisma.aiReport.create({
        data: {
          domain,
          title: result.domain || path,
          summary: result.summary || 'AI report',
          fromDate: payload.fromDate ? new Date(payload.fromDate) : undefined,
          toDate: payload.toDate ? new Date(payload.toDate) : undefined,
          payload: payloadJson,
          result: resultJson,
        },
      });
      return;
    }

    for (const item of issues.slice(0, 25)) {
      const row = {
        domain,
        severity: severity(item.severity),
        code: String(item.code || 'ai_recommendation'),
        message: String(item.message || result.summary || 'AI recommendation'),
        recommendation: item.recommendation ? String(item.recommendation) : undefined,
        entityType: meta.entityType || payload.entityType,
        entityId: meta.entityId || payload.entityId,
        payload: payloadJson,
        result: resultJson,
      };
      await this.prisma.aiCheck.create({ data: row });
      await this.prisma.aiRecommendation.create({
        data: {
          ...row,
          requiresSpecialistReview: Boolean(item.requiresSpecialistReview),
          score: Number.isFinite(Number(item.score)) ? Number(item.score) : 0.5,
        },
      });
    }
  }
}
