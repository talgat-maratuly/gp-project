import { AccountType, Role } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  @IsOptional()
  @IsIn(['IP', 'TOO', 'OTHER'])
  legalForm?: 'IP' | 'TOO' | 'OTHER';

  @IsOptional()
  @IsString()
  @MaxLength(256)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  bin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  contactPerson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  legalAddress?: string;
}
