import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LocalizedNamesDto {
  @ApiProperty()
  @IsString()
  ru!: string;

  @ApiProperty()
  @IsString()
  kk!: string;

  @ApiProperty()
  @IsString()
  en!: string;
}

export class CreateServiceTypeDto {
  @ApiProperty({ example: 'septic' })
  @IsString()
  code!: string;

  @ApiProperty({ type: LocalizedNamesDto })
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names!: LocalizedNamesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateServiceTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, type: LocalizedNamesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names?: LocalizedNamesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateSubserviceTypeDto {
  @ApiProperty({ example: 'vol_3_4' })
  @IsString()
  code!: string;

  @ApiProperty({ type: LocalizedNamesDto })
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names!: LocalizedNamesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateSubserviceTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, type: LocalizedNamesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names?: LocalizedNamesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceTypeId?: string;
}

/** POST /admin/subservices — қызмет таңдаумен */
export class CreateStandaloneSubserviceDto extends CreateSubserviceTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceTypeId?: string;

  @ApiProperty({ required: false, example: 'septic' })
  @IsOptional()
  @IsString()
  serviceCode?: string;
}

export class CreateCityPriceDto {
  @ApiProperty({ required: false, example: 'septic' })
  @IsOptional()
  @IsString()
  serviceCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceTypeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subserviceCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subserviceTypeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oblastId?: string;

  @ApiProperty()
  @IsString()
  cityId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  franchiseId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  gpCommission?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  volumeStart?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  volumeEnd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdateCityPriceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  oblastId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  franchiseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subserviceTypeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  gpCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  volumeStart?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  volumeEnd?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  priority?: number;
}
