import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ModerationRejectDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason: string;
}
