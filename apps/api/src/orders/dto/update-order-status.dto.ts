import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLng?: number;
}
