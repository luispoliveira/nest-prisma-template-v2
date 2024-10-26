import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PageMetaType } from './page-meta.type';

export function Paginated<T>(classRef: Type<T>) {
  abstract class PaginatedType<T> {
    @ApiProperty({
      type: classRef,
      isArray: true,
    })
    items: T[];

    @ApiProperty({
      type: PageMetaType,
    })
    meta: PageMetaType;

    constructor(items: T[], meta: PageMetaType) {
      this.items = items;
      this.meta = meta;
    }
  }

  Object.defineProperty(PaginatedType, 'name', {
    value: `${classRef.name}Paginated`,
  });

  return PaginatedType;
}
