import { Logger } from '@nestjs/common';

export interface QueryFilter {
  field: string;
  operator:
    | 'equals'
    | 'not'
    | 'in'
    | 'notIn'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'contains'
    | 'startsWith'
    | 'endsWith';
  value: any;
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sorts?: QuerySort[];
  limit?: number;
  offset?: number;
  include?: Record<string, any>;
  select?: Record<string, boolean>;
}

export class PrismaQueryBuilder {
  private static readonly logger = new Logger(PrismaQueryBuilder.name);

  /**
   * Build a Prisma where clause from filters
   */
  static buildWhereClause(filters: QueryFilter[]): any {
    if (!filters || filters.length === 0) {
      return {};
    }

    const where: any = {};

    for (const filter of filters) {
      const { field, operator, value } = filter;

      switch (operator) {
        case 'equals':
          where[field] = value;
          break;
        case 'not':
          where[field] = { not: value };
          break;
        case 'in':
          where[field] = { in: Array.isArray(value) ? value : [value] };
          break;
        case 'notIn':
          where[field] = { notIn: Array.isArray(value) ? value : [value] };
          break;
        case 'lt':
          where[field] = { lt: value };
          break;
        case 'lte':
          where[field] = { lte: value };
          break;
        case 'gt':
          where[field] = { gt: value };
          break;
        case 'gte':
          where[field] = { gte: value };
          break;
        case 'contains':
          where[field] = { contains: value, mode: 'insensitive' };
          break;
        case 'startsWith':
          where[field] = { startsWith: value, mode: 'insensitive' };
          break;
        case 'endsWith':
          where[field] = { endsWith: value, mode: 'insensitive' };
          break;
        default:
          this.logger.warn(`Unknown filter operator: ${operator}`);
          break;
      }
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause from sorts
   */
  static buildOrderByClause(sorts: QuerySort[]): any {
    if (!sorts || sorts.length === 0) {
      return { createdAt: 'desc' };
    }

    if (sorts.length === 1) {
      const { field, direction } = sorts[0];
      return { [field]: direction };
    }

    return sorts.map(({ field, direction }) => ({ [field]: direction }));
  }

  /**
   * Build complete query options
   */
  static buildQuery(options: QueryOptions): any {
    const query: any = {};

    if (options.filters) {
      query.where = this.buildWhereClause(options.filters);
    }

    if (options.sorts) {
      query.orderBy = this.buildOrderByClause(options.sorts);
    }

    if (options.limit) {
      query.take = options.limit;
    }

    if (options.offset) {
      query.skip = options.offset;
    }

    if (options.include) {
      query.include = options.include;
    }

    if (options.select) {
      query.select = options.select;
    }

    return query;
  }

  /**
   * Build search query for text fields
   */
  static buildSearchQuery(searchTerm: string, searchFields: string[]): any {
    if (!searchTerm || !searchFields.length) {
      return {};
    }

    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    }));

    return {
      OR: searchConditions,
    };
  }

  /**
   * Build date range query
   */
  static buildDateRangeQuery(
    field: string,
    startDate?: Date,
    endDate?: Date,
  ): any {
    if (!startDate && !endDate) {
      return {};
    }

    const dateFilter: any = {};

    if (startDate) {
      dateFilter.gte = startDate;
    }

    if (endDate) {
      dateFilter.lte = endDate;
    }

    return { [field]: dateFilter };
  }

  /**
   * Combine multiple where clauses with AND
   */
  static combineAndClauses(...clauses: any[]): any {
    const validClauses = clauses.filter(
      clause => clause && Object.keys(clause).length > 0,
    );

    if (validClauses.length === 0) {
      return {};
    }

    if (validClauses.length === 1) {
      return validClauses[0];
    }

    return { AND: validClauses };
  }

  /**
   * Combine multiple where clauses with OR
   */
  static combineOrClauses(...clauses: any[]): any {
    const validClauses = clauses.filter(
      clause => clause && Object.keys(clause).length > 0,
    );

    if (validClauses.length === 0) {
      return {};
    }

    if (validClauses.length === 1) {
      return validClauses[0];
    }

    return { OR: validClauses };
  }

  /**
   * Build pagination query
   */
  static buildPaginationQuery(
    page = 1,
    limit = 10,
  ): { skip: number; take: number } {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  /**
   * Build include clause for relations
   */
  static buildIncludeClause(relations: string[]): any {
    if (!relations || relations.length === 0) {
      return {};
    }

    const include: any = {};

    for (const relation of relations) {
      // Support nested relations with dot notation
      if (relation.includes('.')) {
        const parts = relation.split('.');
        let current = include;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            current[part] = true;
          } else {
            current[part] = current[part] || { include: {} };
            current = current[part].include;
          }
        }
      } else {
        include[relation] = true;
      }
    }

    return include;
  }

  /**
   * Build select clause for specific fields
   */
  static buildSelectClause(fields: string[]): any {
    if (!fields || fields.length === 0) {
      return {};
    }

    const select: any = {};

    for (const field of fields) {
      select[field] = true;
    }

    return select;
  }

  /**
   * Validate and sanitize filter values
   */
  static sanitizeFilters(filters: QueryFilter[]): QueryFilter[] {
    return filters.filter(filter => {
      if (
        !filter.field ||
        filter.value === undefined ||
        filter.value === null
      ) {
        this.logger.warn(`Invalid filter: ${JSON.stringify(filter)}`);
        return false;
      }

      // Sanitize string values
      if (typeof filter.value === 'string') {
        filter.value = filter.value.trim();
        if (filter.value === '') {
          return false;
        }
      }

      return true;
    });
  }
}
