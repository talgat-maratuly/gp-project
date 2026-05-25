import { IsBoolean, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class MobileOtpVerifyDto {
  @IsString()
  @MinLength(10)
  phone: string;

  @IsString()
  @Length(4, 8)
  code: string;

  @IsString()
  @MinLength(8)
  deviceId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;

  @IsOptional()
  @IsBoolean()
  enableBiometric?: boolean;

  @IsOptional()
  @IsString()
  regionId?: string;
}
