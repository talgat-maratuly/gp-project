import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateHunterProjectDto {
  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  shape?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sotki?: number;

  @IsNumber()
  @Min(1)
  length: number;

  @IsNumber()
  @Min(1)
  width: number;

  @IsString()
  waterSource: string;

  @IsNumber()
  pressure: number;

  @IsNumber()
  waterFlow: number;

  @IsOptional()
  @IsArray()
  objects?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  points?: Record<string, unknown>[];

  @IsOptional()
  @IsObject()
  drawing?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
