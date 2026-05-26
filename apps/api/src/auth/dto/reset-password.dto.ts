import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  resetToken: string;

  @ApiProperty({ minLength: 4 })
  @IsString()
  @MinLength(4)
  password: string;
}
