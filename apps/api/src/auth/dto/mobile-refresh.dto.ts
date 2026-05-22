import { IsString, MinLength } from 'class-validator';

export class MobileRefreshDto {
  @IsString()
  @MinLength(20)
  refreshToken: string;

  @IsString()
  @MinLength(8)
  deviceId: string;
}
