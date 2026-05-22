import { IsEnum, IsString, MinLength } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class MobileOtpSendDto {
  @IsString()
  @MinLength(10)
  phone: string;

  @IsEnum(OtpChannel)
  channel: OtpChannel;
}
