import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Web/mobile: refresh rotation via device-bound session */
export class DeviceSessionDto {
  @ApiPropertyOptional({ description: 'Stable device id (min 8 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  deviceName?: string;

  @ApiPropertyOptional({ example: 'web' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  platform?: string;
}
