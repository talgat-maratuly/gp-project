import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false, description: 'Обязательна при отмене заказа' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLng?: number;
}
