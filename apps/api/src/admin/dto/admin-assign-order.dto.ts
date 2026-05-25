import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AdminAssignOrderDto {
  @ApiProperty({ description: 'PartnerProfile.id' })
  @IsUUID()
  assignedPartnerId: string;

  /** @deprecated use assignedPartnerId */
  @ApiProperty({ required: false, deprecated: true })
  @IsOptional()
  @IsUUID()
  partnerId?: string;
}
