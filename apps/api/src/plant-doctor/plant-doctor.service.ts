import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderCategory, PlantCaseStatus, Prisma, Role } from '@prisma/client';
import type { Request } from 'express';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

type CurrentUser = { id: string; role: Role };

function toJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

function plantCaseInclude() {
  return {
    client: { include: { user: { select: { id: true, name: true, phone: true } } } },
    assignedPartner: { include: { user: { select: { id: true, name: true, phone: true } } } },
    order: true,
    knowledgePhotos: true,
  } satisfies Prisma.PlantCaseInclude;
}

@Injectable()
export class PlantDoctorService {
  constructor(
    private prisma: PrismaService,
    private uploads: UploadsService,
    private ai: AiAssistantService,
  ) {}

  async createCase(user: CurrentUser, file: Express.Multer.File, body: { city?: string; description?: string }, req: Request) {
    this.uploads.assertFile(file);
    const client = await this.prisma.clientProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
    if (!client) throw new BadRequestException('Client profile is required');

    const { relativePath } = this.uploads.savePlantPhoto(user.id, file);
    const photoUrl = this.uploads.buildPublicUrl(relativePath, req);
    const city = String(body.city || client.city || 'Уральск');
    const knowledgeBase = await this.prisma.plantKnowledgePhoto.findMany({
      where: { city },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const aiResult = await this.ai.call(
      '/ai/plant-doctor/analyze',
      {
        photoUrl,
        city,
        description: body.description || '',
        knowledgeBase,
      },
      { entityType: 'plant_case' },
    );

    const needsSpecialistReview = Boolean(aiResult?.data?.needsSpecialistReview ?? true);
    const order = needsSpecialistReview
      ? await this.prisma.order.create({
          data: {
            clientId: client.id,
            category: OrderCategory.LAWN,
            city,
            serviceId: 'plant-doctor',
            serviceName: 'AI Plant Doctor',
            clientPhone: client.user.phone,
            clientName: client.user.name,
            comment: body.description || 'Фото-диагностика растения',
            total: '0',
            gpCommission: '0',
          },
        })
      : null;

    const created = await this.prisma.plantCase.create({
      data: {
        clientId: client.id,
        orderId: order?.id,
        city,
        description: body.description || null,
        photoUrl,
        status: needsSpecialistReview ? PlantCaseStatus.SPECIALIST_REVIEW : PlantCaseStatus.AI_ANALYZED,
        aiDiagnosis: toJson(aiResult?.data || {}),
        aiRecommendations: toJson(aiResult?.recommendations || []),
        aiIssues: toJson(aiResult?.issues || []),
        aiConfidence: Number(aiResult?.data?.confidence ?? 0.5),
        needsSpecialistReview,
      },
      include: plantCaseInclude(),
    });

    await this.prisma.aiCheck.updateMany({
      where: { entityType: 'plant_case', entityId: null },
      data: { entityId: created.id },
    });
    await this.prisma.aiRecommendation.updateMany({
      where: { entityType: 'plant_case', entityId: null },
      data: { entityId: created.id },
    });

    return created;
  }

  async listMine(user: CurrentUser) {
    const client = await this.prisma.clientProfile.findUnique({ where: { userId: user.id } });
    if (!client) return [];
    return this.prisma.plantCase.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      include: plantCaseInclude(),
    });
  }

  async listPartner(user: CurrentUser) {
    const partner = await this.prisma.partnerProfile.findUnique({ where: { userId: user.id } });
    if (!partner) return [];
    return this.prisma.plantCase.findMany({
      where: {
        OR: [
          { assignedPartnerId: partner.id },
          { assignedPartnerId: null, needsSpecialistReview: true, city: partner.city || undefined },
          { assignedPartnerId: null, needsSpecialistReview: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: plantCaseInclude(),
    });
  }

  async acceptPartnerCase(user: CurrentUser, id: string) {
    const partner = await this.prisma.partnerProfile.findUnique({ where: { userId: user.id } });
    if (!partner) throw new BadRequestException('Partner profile is required');
    const row = await this.prisma.plantCase.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Plant case not found');
    if (row.assignedPartnerId && row.assignedPartnerId !== partner.id) {
      throw new BadRequestException('Plant case is already assigned');
    }
    return this.prisma.plantCase.update({
      where: { id },
      data: { assignedPartnerId: partner.id, status: PlantCaseStatus.SPECIALIST_REVIEW },
      include: plantCaseInclude(),
    });
  }

  async confirmPartnerCase(user: CurrentUser, id: string, body: { diagnosis?: string; recommendation?: string }) {
    const partner = await this.prisma.partnerProfile.findUnique({ where: { userId: user.id } });
    if (!partner) throw new BadRequestException('Partner profile is required');
    const row = await this.prisma.plantCase.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Plant case not found');
    if (row.assignedPartnerId && row.assignedPartnerId !== partner.id) {
      throw new BadRequestException('Plant case is assigned to another partner');
    }
    return this.prisma.plantCase.update({
      where: { id },
      data: {
        assignedPartnerId: partner.id,
        status: PlantCaseStatus.SPECIALIST_CONFIRMED,
        specialistDiagnosis: body.diagnosis || null,
        specialistRecommendation: body.recommendation || null,
        specialistReviewedAt: new Date(),
      },
      include: plantCaseInclude(),
    });
  }

  async listAdmin() {
    return this.prisma.plantCase.findMany({
      orderBy: { createdAt: 'desc' },
      include: plantCaseInclude(),
    });
  }

  async approveAdmin(id: string, addToKnowledgeBase = false) {
    const row = await this.prisma.plantCase.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Plant case not found');
    const diagnosis = row.specialistDiagnosis || String((row.aiDiagnosis as any)?.diagnosis || 'AI Plant Doctor case');
    const pest = String((row.aiDiagnosis as any)?.pest || '') || null;
    const deficiency = String((row.aiDiagnosis as any)?.deficiency || '') || null;
    if (addToKnowledgeBase && !row.addedToKnowledgeBaseAt) {
      await this.prisma.plantKnowledgePhoto.create({
        data: {
          plantCaseId: row.id,
          photoUrl: row.photoUrl,
          city: row.city,
          diagnosis,
          pest,
          deficiency,
          notes: row.specialistRecommendation || row.description,
        },
      });
    }
    return this.prisma.plantCase.update({
      where: { id },
      data: {
        status: PlantCaseStatus.ADMIN_APPROVED,
        adminApprovedAt: new Date(),
        addedToKnowledgeBaseAt: addToKnowledgeBase ? new Date() : row.addedToKnowledgeBaseAt,
      },
      include: plantCaseInclude(),
    });
  }
}
