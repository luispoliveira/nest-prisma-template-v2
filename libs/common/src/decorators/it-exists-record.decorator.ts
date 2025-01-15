import { registerDecorator, ValidationOptions } from "class-validator";
import { ItExistsRecordValidator } from "../validators/it-exists-record.validator";

export function ItExistsRecord(table: string, column: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [table, column],
      validator: ItExistsRecordValidator,
    });
  };
}
