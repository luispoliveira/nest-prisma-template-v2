import { ItExistsRecord } from '@lib/common';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsDefined,
  IsEmail,
  IsInt,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @MinLength(8)
  @IsStrongPassword({
    minSymbols: 0,
  })
  password: string;

  @ApiProperty()
  @IsDefined()
  @IsInt()
  @ItExistsRecord('role', 'id')
  roleId: number;
}

export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), [
  'roleId',
]) {}
