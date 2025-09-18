import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  token: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    minSymbols: 0,
  })
  password: string;
}
