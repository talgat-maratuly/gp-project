import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, OrderCategory, PartnerRole, PartnerType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PartnerApplyDto } from '../../partners/dto/partner-apply.dto';

/** POST /specialist-requests — PartnerApplyDto негізінде */
export class CreateSpecialistRequestDto extends PartnerApplyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;
}

export class ResubmitSpecialistRequestDto extends CreateSpecialistRequestDto {}
