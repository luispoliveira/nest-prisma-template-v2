import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueRecordValidator implements ValidatorConstraintInterface {
  private _prisma: PrismaClient;

  constructor() {
    this._prisma = new PrismaClient();
  }

  async validate(value: any, validationArguments: ValidationArguments) {
    const [table, column]: string[] = validationArguments.constraints;

    if (!(table in this._prisma) || typeof (this._prisma[table as keyof PrismaClient] as any).findUnique !== "function") {
      throw new Error(`Table ${table} does not exist in the PrismaService or does not have a findUnique method.`);
    }

    const prismaTable = this._prisma[table as keyof PrismaClient] as any;

    const record = await prismaTable.findUnique({
      where: {
        [column]: value,
      },
    });

    return !record;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    return `Record with value: '${validationArguments.value}' already exists for property: '${validationArguments.property}'.`;
  }
}
