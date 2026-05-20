import { ApiProperty } from '@nestjs/swagger';
import { PartnerOfferingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOfferingStatusDto {
  @ApiProperty({ enum: PartnerOfferingStatus })
  @IsEnum(PartnerOfferingStatus)
  status: PartnerOfferingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moderationNote?: string;
}
