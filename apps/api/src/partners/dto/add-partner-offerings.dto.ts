import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AddPartnerOfferingsDto {
  @ApiProperty({ type: [String], description: 'Идентификаторы подуслуг из каталога' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subserviceIds: string[];
}
