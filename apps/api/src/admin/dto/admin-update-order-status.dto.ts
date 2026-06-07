import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AdminUpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false, description: 'PartnerProfile.id при назначении' })
  @IsOptional()
  @IsUUID()
  assignedPartnerId?: string;

  /** @deprecated use assignedPartnerId */
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({ required: false, description: 'Обязательна при отмене заказа' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
