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

export class CreateFranchiseServiceDto {
  @ApiProperty()
  @IsString()
  franchiseId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiProperty({ type: LocalizedNamesDto })
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names!: LocalizedNamesDto;

  @ApiProperty()
  @IsInt()
  @Min(0)
  basePrice!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  gpCommission!: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateFranchiseServiceDto {
  @ApiProperty({ required: false, type: LocalizedNamesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names?: LocalizedNamesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  gpCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateFranchiseSubserviceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ type: LocalizedNamesDto })
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names!: LocalizedNamesDto;

  @ApiProperty()
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  gpCommission!: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateFranchiseSubserviceDto {
  @ApiProperty({ required: false, type: LocalizedNamesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNamesDto)
  names?: LocalizedNamesDto;

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
  sortOrder?: number;
}

export type LocalizedNames = { ru: string; kk: string; en: string };

export function assertLocalizedNames(names: unknown): LocalizedNames {
  if (!names || typeof names !== 'object') {
    throw new Error('names required');
  }
  const n = names as Record<string, unknown>;
  const ru = String(n.ru || '').trim();
  const kk = String(n.kk || '').trim();
  const en = String(n.en || '').trim();
  if (!ru || !kk || !en) {
    throw new Error('names.ru, names.kk, names.en are required');
  }
  return { ru, kk, en };
}

export function mapServiceRecord(
  s: {
    id: string;
    franchiseId: string;
    templateId: string;
    cityId: string | null;
    names: unknown;
    basePrice: number;
    gpCommission: number;
    active: boolean;
    subservices: Array<{
      id: string;
      externalId: string | null;
      names: unknown;
      price: number;
      gpCommission: number;
      active: boolean;
      sortOrder: number;
    }>;
  },
) {
  const names = assertLocalizedNames(s.names);
  return {
    id: s.id,
    templateId: s.templateId,
    franchiseId: s.franchiseId,
    cityId: s.cityId,
    names,
    name: names.ru,
    basePrice: s.basePrice,
    gpCommission: s.gpCommission,
    active: s.active,
    subservices: (s.subservices || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapSubserviceRecord),
  };
}

export function mapSubserviceRecord(sub: {
  id: string;
  externalId?: string | null;
  names: unknown;
  price: number;
  gpCommission: number;
  active: boolean;
  sortOrder?: number;
}) {
  const names = assertLocalizedNames(sub.names);
  return {
    id: sub.id,
    externalId: sub.externalId ?? null,
    names,
    name: names.ru,
    price: sub.price,
    gpCommission: sub.gpCommission,
    active: sub.active,
    sortOrder: sub.sortOrder ?? 0,
  };
}

export function mapFranchiseRecord(f: {
  id: string;
  name: string;
  city: string | null;
  cityId: string | null;
  regionId: string | null;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: f.id,
    name: f.name,
    city: f.city || f.name,
    cityId: f.cityId,
    regionId: f.regionId,
    status: f.isActive ? 'ACTIVE' : 'INACTIVE',
    createdAt: f.createdAt.toISOString().slice(0, 10),
  };
}
