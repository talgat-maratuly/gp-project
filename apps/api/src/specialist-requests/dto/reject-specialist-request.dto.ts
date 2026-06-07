import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SpecialistRejectionReasonCode } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RejectSpecialistRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  rejectionReason: string;

  @ApiPropertyOptional({ enum: SpecialistRejectionReasonCode })
  @IsOptional()
  @IsEnum(SpecialistRejectionReasonCode)
  rejectionReasonCode?: SpecialistRejectionReasonCode;
}
