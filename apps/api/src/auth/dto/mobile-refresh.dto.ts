import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class MobileRefreshDto {
  @IsString()
  @MinLength(20)
  refreshToken: string;

  @IsString()
  @MinLength(8)
  deviceId: string;

  /** Көп рөлді аккаунт: сессия контексті (client / partner / admin) */
  @IsOptional()
  @IsEnum(Role)
  sessionRole?: Role;
}
