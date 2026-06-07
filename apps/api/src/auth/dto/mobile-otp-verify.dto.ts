import { AccountType, Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, Length, MinLength } from 'class-validator';

export const OTP_LOGIN_AS = ['client', 'partner', 'admin'] as const;
export type OtpLoginAsDto = (typeof OTP_LOGIN_AS)[number];

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

  @IsOptional()
  @IsIn(OTP_LOGIN_AS)
  loginAs?: OtpLoginAsDto;

  @IsOptional()
  @IsEnum(Role)
  desiredRole?: Role;

  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;
}
