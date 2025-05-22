import { IsUniqueRecord } from "@lib/common";
import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsDefined, IsString } from "class-validator";

export class CreateRoleDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsUniqueRecord("role", "name")
  name: string;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
