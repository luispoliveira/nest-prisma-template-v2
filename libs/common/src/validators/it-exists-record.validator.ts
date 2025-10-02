import { PrismaClient } from '@gen/prisma-client';
import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * ## Only works with PrismaClient
 */

@ValidatorConstraint({ async: true })
@Injectable()
export class ItExistsRecordValidator implements ValidatorConstraintInterface {
  private _prisma: PrismaClient;

  constructor() {
    this._prisma = new PrismaClient();
  }
  async validate(value: any, validationArguments: ValidationArguments) {
    const [table, column]: string[] = validationArguments.constraints;
    if (
      !(table in this._prisma) ||
      typeof (this._prisma[table as keyof PrismaClient] as any).findFirst !==
        'function'
    ) {
      throw new Error(
        `Table ${table} does not exist in the PrismaService or does not have a findUnique method.`,
      );
    }

    const prismaTable = this._prisma[table as keyof PrismaClient] as any;

    const record = await prismaTable.findFirst({
      where: {
        [column]: value,
      },
    });

    return !!record;
  }
  defaultMessage?(validationArguments: ValidationArguments): string {
    return `Record with value: '${validationArguments.value}' does not exist for property: '${validationArguments.property}'.`;
  }
}
