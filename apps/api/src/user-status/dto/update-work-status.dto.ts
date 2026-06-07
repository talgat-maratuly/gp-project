import { ApiProperty } from '@nestjs/swagger';
import { WorkStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateWorkStatusDto {
  @ApiProperty({ enum: WorkStatus })
  @IsEnum(WorkStatus)
  workStatus: WorkStatus;
}

export class UpdatePartnerPresenceDto {
  @ApiProperty({ enum: WorkStatus, required: false })
  @IsOptional()
  @IsEnum(WorkStatus)
  workStatus?: WorkStatus;

  @ApiProperty({ required: false, deprecated: true })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}
