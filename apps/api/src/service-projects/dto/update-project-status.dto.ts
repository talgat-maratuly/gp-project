import { IsEnum } from 'class-validator';
import { ServiceProjectStatus } from '@prisma/client';

export class UpdateProjectStatusDto {
  @IsEnum(ServiceProjectStatus)
  status: ServiceProjectStatus;
}
