import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AdminAssignOrderDto {
  @ApiProperty({ description: 'PartnerProfile.id' })
  @IsUUID()
  partnerId: string;
}
