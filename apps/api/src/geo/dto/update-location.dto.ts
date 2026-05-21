import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  executorLng?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  orderId?: string;
}
