import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class FileComplaintDto {
  @ApiProperty()
  @IsUUID()
  targetUserId: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
