import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  QrObjectStatus,
  QrOrderStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQrObjectDto } from './dto/create-qr-object.dto';
import { CreateQrOrderDto } from './dto/create-qr-order.dto';
import { UpdateQrOrderStatusDto } from './dto/update-qr-order-status.dto';

const PARTNER_FLOW: Partial<Record<QrOrderStatus, QrOrderStatus>> = {
  [QrOrderStatus.new]: QrOrderStatus.accepted,
  [QrOrderStatus.assigned]: QrOrderStatus.accepted,
  [QrOrderStatus.accepted]: QrOrderStatus.on_the_way,
  [QrOrderStatus.on_the_way]: QrOrderStatus.in_progress,
  [QrOrderStatus.in_progress]: QrOrderStatus.completed,
};

@Injectable()
export class QrService {
  constructor(private prisma: PrismaService) {}

  private async findActiveObject(qrCode: string) {
    const code = qrCode.trim().toUpperCase();
    const obj = await this.prisma.qRCodeObject.findFirst({
      where: { qrCode: code, status: QrObjectStatus.active },
      include: {
        product: { include: { partner: { include: { user: { select: { name: true, phone: true } } } } } },
      },
    });
    if (!obj) throw new NotFoundException('QR не найден');
    return obj;
  }

  async getPublic(qrCode: string) {
    const obj = await this.findActiveObject(qrCode);
    const [ordersCount, scansCount] = await Promise.all([
      this.prisma.qRServiceOrder.count({ where: { qrCode: obj.qrCode } }),
      this.prisma.qRScanLog.count({ where: { qrCode: obj.qrCode } }),
    ]);
    return {
      id: obj.id,
      qrCode: obj.qrCode,
      title: obj.title,
      type: obj.type,
      serviceType: obj.serviceType,
      address: obj.address,
      city: obj.city,
      description: obj.description,
      photo: obj.photo,
      lastServiceDate: obj.lastServiceDate,
      nextServiceDate: obj.nextServiceDate,
      phone: obj.phone,
      product: obj.product
        ? {
            id: obj.product.id,
            name: obj.product.name,
            price: Number(obj.product.price),
            stock: obj.product.stock,
            category: obj.product.category,
          }
        : null,
      ordersCount,
      scansCount,
    };
  }

  async logScan(qrCode: string, meta: { userAgent?: string; ipAddress?: string; deviceType?: string; action?: string }) {
    const obj = await this.findActiveObject(qrCode);
    return this.prisma.qRScanLog.create({
      data: {
        qrCodeObjectId: obj.id,
        qrCode: obj.qrCode,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        deviceType: meta.deviceType,
        action: meta.action || 'view',
      },
    });
  }

  async createPublicOrder(qrCode: string, dto: CreateQrOrderDto) {
    const obj = await this.findActiveObject(qrCode);
    const totalPrice = obj.product ? Number(obj.product.price) + 3000 : 8000;
    const gpCommission = Math.round(totalPrice * 0.12);
    const order = await this.prisma.qRServiceOrder.create({
      data: {
        qrCodeObjectId: obj.id,
        qrCode: obj.qrCode,
        serviceType: obj.serviceType,
        clientName: dto.clientName,
        phone: dto.phone,
        address: dto.address,
        comment: dto.comment,
        photo: dto.photo,
        status: obj.partnerId ? QrOrderStatus.assigned : QrOrderStatus.new,
        assignedPartnerId: obj.partnerId,
        totalPrice,
        gpCommission,
        franchiseId: obj.franchiseId,
      },
    });
    await this.logScan(qrCode, { action: 'order_created' });
    return order;
  }

  async listObjects() {
    return this.prisma.qRCodeObject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        _count: { select: { orders: true, scanLogs: true } },
      },
    });
  }

  async getObject(id: string) {
    const obj = await this.prisma.qRCodeObject.findUnique({
      where: { id },
      include: {
        product: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 50 },
        scanLogs: { orderBy: { scannedAt: 'desc' }, take: 100 },
      },
    });
    if (!obj) throw new NotFoundException();
    return obj;
  }

  async createObject(dto: CreateQrObjectDto) {
    const qrCode = (dto.qrCode || `QR-${dto.type.toUpperCase().slice(0, 4)}-${Date.now().toString(36).slice(-4)}`).toUpperCase();
    const exists = await this.prisma.qRCodeObject.findUnique({ where: { qrCode } });
    if (exists) throw new BadRequestException('Такой QR-код уже есть');
    return this.prisma.qRCodeObject.create({
      data: {
        qrCode,
        title: dto.title,
        type: dto.type,
        serviceType: dto.serviceType,
        productId: dto.productId,
        clientId: dto.clientId,
        partnerId: dto.partnerId,
        address: dto.address,
        city: dto.city || '',
        description: dto.description,
        photo: dto.photo,
        lastServiceDate: dto.lastServiceDate ? new Date(dto.lastServiceDate) : undefined,
        nextServiceDate: dto.nextServiceDate ? new Date(dto.nextServiceDate) : undefined,
        status: dto.status || QrObjectStatus.active,
        phone: dto.phone,
        franchiseId: dto.franchiseId,
      },
    });
  }

  async updateObject(id: string, patch: Partial<CreateQrObjectDto>) {
    await this.getObject(id);
    return this.prisma.qRCodeObject.update({
      where: { id },
      data: {
        ...patch,
        lastServiceDate: patch.lastServiceDate ? new Date(patch.lastServiceDate) : undefined,
        nextServiceDate: patch.nextServiceDate ? new Date(patch.nextServiceDate) : undefined,
      },
    });
  }

  async stats() {
    const [objects, scans, orders] = await Promise.all([
      this.prisma.qRCodeObject.count(),
      this.prisma.qRScanLog.count(),
      this.prisma.qRServiceOrder.count(),
    ]);
    const ordersNew = await this.prisma.qRServiceOrder.count({ where: { status: QrOrderStatus.new } });
    return {
      objectsTotal: objects,
      scansTotal: scans,
      ordersTotal: orders,
      ordersNew,
      conversionPercent: scans ? Math.min(100, Math.round((orders / scans) * 100)) : 0,
    };
  }

  async listOrdersForPartner(partnerId: string, serviceType?: string) {
    return this.prisma.qRServiceOrder.findMany({
      where: {
        assignedPartnerId: partnerId,
        ...(serviceType ? { serviceType: serviceType as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { qrCodeObject: true },
    });
  }

  async updateOrderStatus(orderId: string, partnerId: string, dto: UpdateQrOrderStatusDto) {
    const order = await this.prisma.qRServiceOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.assignedPartnerId !== partnerId) throw new BadRequestException('Нет доступа');
    const allowed = PARTNER_FLOW[order.status];
    if (dto.status !== QrOrderStatus.cancelled && allowed && dto.status !== allowed) {
      throw new BadRequestException(`Ожидается статус: ${allowed}`);
    }
    return this.prisma.qRServiceOrder.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }

  async listAllOrders() {
    return this.prisma.qRServiceOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { qrCodeObject: true, partner: { include: { user: true } } },
    });
  }
}
