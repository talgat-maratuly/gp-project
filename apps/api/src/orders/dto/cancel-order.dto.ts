import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ description: 'Причина отмены (обязательна)' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  cancelReason: string;
}
