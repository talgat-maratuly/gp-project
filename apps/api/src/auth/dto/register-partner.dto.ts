import { ApiProperty } from '@nestjs/swagger';
import { AccountType, PartnerDirection, PartnerRole, PartnerType } from '@prisma/client';
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

/** MVP: email/password/name/phone/region опциональны — подставляются на сервере; partnerRole обязателен */
export class RegisterPartnerDto {
  @ApiProperty({ required: false, example: 'test_partner_123@gp.local' })
  @IsOptional()
  @ValidateIf((o) => Boolean(o.email?.trim()))
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, minLength: 6, example: '123456' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false, example: 'Тест партнёр' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

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

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL, required: false })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiProperty({ enum: PartnerRole, description: 'specialist | shop | mixed_partner' })
  @IsEnum(PartnerRole)
  partnerRole: PartnerRole;

  @ApiProperty({ enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  partnerType?: PartnerType;

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
