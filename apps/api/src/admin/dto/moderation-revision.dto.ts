import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ModerationRevisionDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  comment: string;
}
