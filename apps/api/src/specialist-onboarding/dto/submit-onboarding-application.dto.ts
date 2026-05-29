import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MainServiceId } from '../specialist-onboarding.catalog';

export class VehicleDataDto {
  @ApiProperty()
  @IsString()
  vehicleType: string;

  @ApiProperty()
  @IsString()
  vehicleBrand: string;

  @ApiProperty()
  @IsString()
  licensePlate: string;

  @ApiProperty()
  @IsUrl({}, { message: 'vehiclePhotoUrl must be a URL' })
  vehiclePhotoUrl: string;

  @ApiProperty()
  @IsString()
  tankVolume: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  registrationPhotoUrls: string[];

  @ApiProperty()
  @IsString()
  driverLicenseCategory: string;

  @ApiProperty()
  @IsUrl()
  driverLicensePhotoUrl: string;
}

export class SubmitOnboardingApplicationDto {
  @ApiProperty({ enum: ['SEPTIC', 'LAWN', 'AUTOWATERING', 'FILTERS', 'OTHER'] })
  @IsString()
  mainServiceId: MainServiceId;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subserviceIds: string[];

  @ApiProperty()
  @IsUUID()
  regionId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  fullName: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty()
  @IsUrl()
  profilePhotoUrl: string;

  @ApiProperty()
  @IsUrl()
  idCardFrontUrl: string;

  @ApiProperty()
  @IsUrl()
  idCardBackUrl: string;

  @ApiPropertyOptional({ type: VehicleDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDataDto)
  vehicle?: VehicleDataDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsUrl({}, { each: true })
  equipmentPhotoUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1500)
  workExperience?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  attachmentUrls?: string[];

  @ApiProperty()
  @IsBoolean()
  termsAccepted: boolean;

  @ApiProperty()
  @IsBoolean()
  personalDataAccepted: boolean;

  @ApiPropertyOptional({ description: 'Resubmit existing REJECTED application' })
  @IsOptional()
  @IsUUID()
  resubmitRequestId?: string;
}
