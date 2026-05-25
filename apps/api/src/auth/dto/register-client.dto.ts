import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterClientDto {
  @ApiProperty({ example: 'client@gp.kz' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({ required: false, description: 'Для юрлица' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  bin?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  legalAddress?: string;

  @ApiProperty({ required: false, description: 'Контактное лицо (юрлицо)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contactPerson?: string;

  @ApiProperty({ description: 'UUID региона (город GP Market)' })
  @IsString()
  regionId: string;

  @ApiProperty({ required: false, example: 'Уральск', description: 'Отображаемый город (если отличается от name региона)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;
}
