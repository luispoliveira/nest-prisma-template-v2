import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsUniqueRecordValidator } from '../validators/is-unique-record.validator';

export function IsUniqueRecord(
  table: string,
  column: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [table, column],
      validator: IsUniqueRecordValidator,
    });
  };
}
