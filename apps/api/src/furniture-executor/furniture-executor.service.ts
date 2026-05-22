import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FurnitureServiceType,
  QrOrderStatus,
  ServiceProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const FLOW: Partial<Record<QrOrderStatus, QrOrderStatus>> = {
  [QrOrderStatus.new]: QrOrderStatus.accepted,
  [QrOrderStatus.assigned]: QrOrderStatus.accepted,
  [QrOrderStatus.accepted]: QrOrderStatus.on_the_way,
  [QrOrderStatus.on_the_way]: QrOrderStatus.in_progress,
  [QrOrderStatus.in_progress]: QrOrderStatus.completed,
};

@Injectable()
export class FurnitureExecutorService {
  constructor(private prisma: PrismaService) {}

  async syncServiceAccessFromOfferings(partnerId: string) {
    const offerings = await this.prisma.partnerServiceOffering.findMany({
      where: { partnerId, status: 'ACTIVE' },
    });
    const access = offerings
      .map((o) => o.subserviceId)
      .filter((id): id is FurnitureServiceType =>
        (Object.values(FurnitureServiceType) as string[]).includes(id),
      );
    await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data: { serviceAccess: access },
    });
    return access;
  }

  async createFromFurnitureProject(projectId: string, client: { name: string; phone?: string | null; city?: string | null }) {
    const project = await this.prisma.serviceProject.findUnique({
      where: { id: projectId },
      include: { furniture: true },
    });
    if (!project || project.type !== 'furniture') {
      throw new NotFoundException('Проект мебели не найден');
    }
    const existing = await this.prisma.furnitureExecutorOrder.findUnique({
      where: { serviceProjectId: projectId },
    });
    if (existing) return existing;

    const total = Number(project.totalPrice);
    return this.prisma.furnitureExecutorOrder.create({
      data: {
        serviceType: FurnitureServiceType.furniture_manufacturing,
        serviceProjectId: projectId,
        clientName: client.name,
        phone: client.phone || '',
        address: client.city || 'Уральск',
        city: client.city,
        comment: project.furniture
          ? `Проект мебели · ${project.furniture.material} / ${project.furniture.color}`
          : 'Мебель на заказ',
        status: QrOrderStatus.new,
        executorInternal: true,
        totalPrice: total,
        gpCommission: Number(project.gpCommission),
        franchiseId: project.franchiseId,
      },
    });
  }

  async createFromServiceRequest(data: {
    serviceType: FurnitureServiceType;
    clientName: string;
    phone: string;
    address: string;
    comment?: string;
    city?: string;
    totalPrice: number;
    franchiseId?: string;
  }) {
    const gpCommission = Math.round(data.totalPrice * 0.12);
    return this.prisma.furnitureExecutorOrder.create({
      data: {
        ...data,
        status: QrOrderStatus.new,
        executorInternal: true,
        gpCommission,
      },
    });
  }

  async listForPartner(partnerId: string, serviceType?: FurnitureServiceType) {
    const profile = await this.prisma.partnerProfile.findUnique({ where: { id: partnerId } });
    if (!profile) throw new NotFoundException('Партнёр не найден');
    const access = profile.serviceAccess || [];

    const orders = await this.prisma.furnitureExecutorOrder.findMany({
      where: {
        ...(serviceType ? { serviceType } : {}),
        OR: [
          { assignedPartnerId: partnerId },
          {
            status: { in: [QrOrderStatus.new, QrOrderStatus.assigned] },
            executorInternal: true,
            ...(access.length ? { serviceType: { in: access } } : { serviceType: { in: [] } }),
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders;
  }

  async accept(orderId: string, partnerId: string) {
    const order = await this.getOrder(orderId);
    const profile = await this.prisma.partnerProfile.findUnique({ where: { id: partnerId } });
    if (!profile?.serviceAccess?.includes(order.serviceType)) {
      throw new ForbiddenException('Нет доступа к этому направлению');
    }
    if (order.assignedPartnerId && order.assignedPartnerId !== partnerId) {
      throw new ForbiddenException('Заявка уже назначена');
    }
    return this.prisma.furnitureExecutorOrder.update({
      where: { id: orderId },
      data: {
        assignedPartnerId: partnerId,
        status: QrOrderStatus.accepted,
        executorInternal: false,
      },
    });
  }

  async updateStatus(orderId: string, partnerId: string, status: QrOrderStatus) {
    const order = await this.getOrder(orderId);
    if (order.assignedPartnerId !== partnerId) {
      throw new ForbiddenException('Заявка не назначена вам');
    }
    const next = FLOW[order.status];
    if (status !== next && status !== QrOrderStatus.cancelled) {
      throw new BadRequestException('Недопустимый переход статуса');
    }
    return this.prisma.furnitureExecutorOrder.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async decline(orderId: string, partnerId: string) {
    const order = await this.getOrder(orderId);
    if (order.assignedPartnerId && order.assignedPartnerId !== partnerId) {
      throw new ForbiddenException('Заявка не назначена вам');
    }
    if (!order.assignedPartnerId) {
      return order;
    }
    return this.prisma.furnitureExecutorOrder.update({
      where: { id: orderId },
      data: {
        status: QrOrderStatus.new,
        assignedPartnerId: null,
        executorInternal: true,
      },
    });
  }

  private async getOrder(id: string) {
    const order = await this.prisma.furnitureExecutorOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Заявка не найдена');
    return order;
  }

  async ensureManufacturingOnSubmit(projectId: string, userId: string) {
    const project = await this.prisma.serviceProject.findUnique({
      where: { id: projectId },
      include: { client: { include: { user: true } } },
    });
    if (!project || project.status !== ServiceProjectStatus.submitted) return null;
    const u = project.client.user;
    return this.createFromFurnitureProject(projectId, {
      name: u.name,
      phone: u.phone,
      city: project.city || project.client.city,
    });
  }
}
