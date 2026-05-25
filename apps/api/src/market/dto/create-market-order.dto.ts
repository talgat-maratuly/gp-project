import { ApiProperty } from '@nestjs/swagger';
import { MarketDeliveryType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class MarketOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  qty: number;
}

export class CreateMarketOrderDto {
  @ApiProperty()
  @IsUUID()
  storeId: string;

  @ApiProperty({ type: [MarketOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarketOrderItemDto)
  items: MarketOrderItemDto[];

  @ApiProperty({ enum: MarketDeliveryType })
  @IsEnum(MarketDeliveryType)
  deliveryType: MarketDeliveryType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
