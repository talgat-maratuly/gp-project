import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

/** MVP: region/email/password опциональны — подставляются на сервере */
export class RegisterClientDto {
  @ApiProperty({ required: false, example: 'test_123@gp.local' })
  @IsOptional()
  @ValidateIf((o) => Boolean(o.email?.trim()))
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, minLength: 6, example: '123456' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false, example: 'Айдар' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: AccountType, default: AccountType.INDIVIDUAL, required: false })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

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

  @ApiProperty({ required: false, description: 'UUID региона (MVP: не обязателен)' })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiProperty({ required: false, example: 'Уральск' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  city?: string;
}
