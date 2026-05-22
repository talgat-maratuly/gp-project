import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFurnitureProjectDto {
  @IsOptional()
  @IsString()
  photo?: string;

  @IsNumber()
  @Min(1)
  roomWidth: number;

  @IsNumber()
  @Min(1)
  roomHeight: number;

  @IsNumber()
  @Min(0.5)
  furnitureLength: number;

  @IsNumber()
  @Min(0.4)
  furnitureDepth: number;

  @IsString()
  material: string;

  @IsString()
  facadeMaterial: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
