import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { QrObjectStatus, QrObjectType, QrServiceType } from '@prisma/client';

export class CreateQrObjectDto {
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsString()
  title: string;

  @IsEnum(QrObjectType)
  type: QrObjectType;

  @IsEnum(QrServiceType)
  serviceType: QrServiceType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsDateString()
  lastServiceDate?: string;

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string;

  @IsOptional()
  @IsEnum(QrObjectStatus)
  status?: QrObjectStatus;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  franchiseId?: string;
}
