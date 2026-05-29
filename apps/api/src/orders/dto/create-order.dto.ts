import { ApiProperty } from '@nestjs/swagger';
import { LawnWorkType, OrderCategory, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PREFERRED_TIME_SLOTS } from '../../common/schedule.util';

class OrderItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderCategory })
  @IsEnum(OrderCategory)
  category: OrderCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clientLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clientLng?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  septicVolume?: number;

  @ApiProperty({ required: false, example: '2026-05-21' })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiProperty({ required: false, example: '15:00' })
  @IsOptional()
  @IsIn([...PREFERRED_TIME_SLOTS])
  preferredTime?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  flexibleTime?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  lawnAreaSqm?: number;

  @ApiProperty({ enum: LawnWorkType, required: false })
  @IsOptional()
  @IsEnum(LawnWorkType)
  lawnWorkType?: LawnWorkType;

  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  /** GP/GLOBAL оператор: клиент телефоны (мобильді қосымшасы жоқ) */
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  onBehalfClientPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  onBehalfClientName?: string;

  @ApiProperty({ required: false, description: 'Оператор таңдайтын қала' })
  @IsOptional()
  @IsString()
  onBehalfCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  regionId?: string;
}
