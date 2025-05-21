import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsDefined, IsEmail, IsString, IsStrongPassword, MinLength } from "class-validator";

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
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
