import { ApiProperty } from '@nestjs/swagger';
import { AccountType, PartnerDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PartnerDocumentItemDto } from './partner-document.dto';

export class RegisterPartnerDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: 'UUID региона GP Market (MVP: не обязателен)' })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiProperty({ required: false, example: 'Уральск' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  bin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  legalAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  idDocumentNumber?: string;

  @ApiProperty({ type: [PartnerDocumentItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerDocumentItemDto)
  documents?: PartnerDocumentItemDto[];

  @ApiProperty({ required: false, description: 'Код приглашения GP (если есть)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  referralCode?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => !o.directions?.length)
  @ArrayMinSize(1, { message: 'Укажите subserviceIds или directions' })
  @IsString({ each: true })
  subserviceIds?: string[];

  @ApiProperty({ required: false, enum: PartnerDirection, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => !o.subserviceIds?.length)
  @ArrayMinSize(1, { message: 'Укажите subserviceIds или directions' })
  @IsEnum(PartnerDirection, { each: true })
  directions?: PartnerDirection[];
}
