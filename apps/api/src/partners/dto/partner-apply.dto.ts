import { ApiProperty } from '@nestjs/swagger';
import { AccountType, PartnerRole, PartnerType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PartnerDocumentItemDto } from '../../auth/dto/partner-document.dto';

export class PartnerApplyDto {
  @ApiProperty({ enum: PartnerType })
  @IsEnum(PartnerType)
  partnerType: PartnerType;

  @ApiProperty({ enum: PartnerRole, required: false })
  @IsOptional()
  @IsEnum(PartnerRole)
  partnerRole?: PartnerRole;

  @ApiProperty({ required: false, description: 'MVP: регион из GET /api/regions' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  regionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  legalAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  idDocumentNumber?: string;

  @ApiProperty({ type: [PartnerDocumentItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerDocumentItemDto)
  documents?: PartnerDocumentItemDto[];

  /** Для SPECIALIST / OTHER — выбранные подуслуги */
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subserviceIds?: string[];
}
