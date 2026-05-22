import { IsEnum } from 'class-validator';
import { QrOrderStatus } from '@prisma/client';

export class UpdateQrOrderStatusDto {
  @IsEnum(QrOrderStatus)
  status: QrOrderStatus;
}
