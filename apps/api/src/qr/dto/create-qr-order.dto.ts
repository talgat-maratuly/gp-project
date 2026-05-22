import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateQrOrderDto {
  @IsString()
  @MinLength(2)
  clientName: string;

  @IsString()
  @MinLength(8)
  phone: string;

  @IsString()
  @MinLength(3)
  address: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  photo?: string;
}
