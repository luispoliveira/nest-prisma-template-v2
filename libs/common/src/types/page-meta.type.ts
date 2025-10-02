import { ApiProperty } from '@nestjs/swagger';

export class PageMetaType {
  @ApiProperty()
  page: number;
  @ApiProperty()
  pageSize: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  total: number;

  constructor() {
    this.page = 0;
    this.pageSize = 0;
    this.totalPages = 0;
    this.total = 0;
  }

  static getMetaInfo(total: number, skip: number, take: number): PageMetaType {
    return {
      total: total,
      totalPages: Math.ceil(total / take),
      page: Math.ceil(skip / take),
      pageSize: take,
    };
  }
}
