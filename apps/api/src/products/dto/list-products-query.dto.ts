import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListProductsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'City name, for example Уральск' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'City id, for example city-uralsk' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'Franchise id, for example fr-uralsk' })
  @IsOptional()
  @IsString()
  franchiseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedServiceType?: string;
}
