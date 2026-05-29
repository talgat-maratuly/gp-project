import { ApiProperty } from '@nestjs/swagger';
import { PortalRole } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignPortalRolesDto {
  @ApiProperty({ enum: PortalRole, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PortalRole, { each: true })
  roles: PortalRole[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  franchiseId?: string;

  @ApiProperty({ required: false, description: 'Оператор тапсырысы: клиент телефоны' })
  @IsOptional()
  @IsString()
  targetUserId?: string;
}
