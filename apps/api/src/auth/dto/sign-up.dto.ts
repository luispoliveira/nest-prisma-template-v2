import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsEmail, IsString, IsStrongPassword, MinLength } from "class-validator";

export class SignUpDto {
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
