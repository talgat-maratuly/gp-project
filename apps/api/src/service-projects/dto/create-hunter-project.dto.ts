import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateHunterProjectDto {
  @IsOptional()
  @IsString()
  photo?: string;

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
  @IsBoolean()
  submit?: boolean;
}
