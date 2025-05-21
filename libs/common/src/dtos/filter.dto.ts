import { Prisma } from "@gen/prisma-client";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class NestedIntFilter {
  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  equals?: number | null;

  @ApiPropertyOptional({ type: [Number], format: "integer" })
  @IsOptional()
  @IsNumber({}, { each: true })
  in?: number[] | null;

  @ApiPropertyOptional({ type: [Number], format: "integer" })
  @IsOptional()
  @IsNumber({}, { each: true })
  notIn?: number[] | null;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  lt?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  lte?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  gt?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  gte?: number;

  @ApiPropertyOptional({ type: NestedIntFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedIntFilter)
  not?: NestedIntFilter;
}

export class IntFilter {
  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  equals?: number | null;

  @ApiPropertyOptional({ type: [Number], format: "integer" })
  @IsOptional()
  @IsNumber({}, { each: true })
  in?: number[] | null;

  @ApiPropertyOptional({ type: [Number], format: "integer" })
  @IsOptional()
  @IsNumber({}, { each: true })
  notIn?: number[] | null;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  lt?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  lte?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  gt?: number;

  @ApiPropertyOptional({ type: Number, format: "integer" })
  @IsOptional()
  @IsNumber()
  gte?: number;

  @ApiPropertyOptional({ type: NestedIntFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedIntFilter)
  not?: NestedIntFilter;
}

export class NestedStringFilter {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  equals?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  in?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notIn?: string[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  lt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  lte?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gte?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  contains?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  startsWith?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  endsWith?: string;

  @ApiPropertyOptional({ type: NestedStringFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedStringFilter)
  not?: NestedStringFilter;
}

export class StringFilter {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  equals?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notIn?: string[];

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  lt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  lte?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gt?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  gte?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  contains?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  startsWith?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  endsWith?: string;

  @ApiPropertyOptional({ enum: Prisma.QueryMode })
  @IsOptional()
  @IsEnum(Prisma.QueryMode)
  mode?: Prisma.QueryMode;

  @ApiPropertyOptional({ type: NestedStringFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedStringFilter)
  not?: NestedStringFilter;
}

export class NestedBoolFilter {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  equals?: boolean;

  @ApiPropertyOptional({ type: NestedBoolFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedBoolFilter)
  not?: NestedBoolFilter;
}
export class BoolFilter {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  equals?: boolean;

  @ApiPropertyOptional({ type: NestedBoolFilter })
  @IsOptional()
  @ValidateNested()
  @Type(() => NestedBoolFilter)
  not?: NestedBoolFilter;
}
