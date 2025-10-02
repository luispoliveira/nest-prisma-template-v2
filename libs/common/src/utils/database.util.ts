import { Prisma } from '@gen/prisma-client';

export class DatabaseUtil {
  static buildWhereClause(filters: Record<string, any>): Prisma.JsonObject {
    const where: Prisma.JsonObject = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string') {
          // Enable case-insensitive search for strings
          where[key] = {
            contains: value,
            mode: 'insensitive',
          };
        } else if (Array.isArray(value)) {
          // Handle array filters (e.g., status in ['active', 'inactive'])
          where[key] = {
            in: value,
          };
        } else if (typeof value === 'object' && value.from && value.to) {
          // Handle date/number ranges
          where[key] = {
            gte: value.from,
            lte: value.to,
          };
        } else {
          // Direct match
          where[key] = value;
        }
      }
    });

    return where;
  }

  static buildOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Prisma.JsonObject | undefined {
    if (!sortBy) return undefined;

    return {
      [sortBy]: sortOrder,
    };
  }

  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  static buildPaginationMeta(page: number, limit: number, total: number) {
    const totalPages = this.calculateTotalPages(total, limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  static handlePrismaError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new Error(`Unique constraint violation: ${error.meta?.target}`);
        case 'P2025':
          throw new Error('Record not found');
        case 'P2003':
          throw new Error('Foreign key constraint violation');
        case 'P2004':
          throw new Error('Database constraint violation');
        default:
          throw new Error(`Database error: ${error.message}`);
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      throw new Error('Unknown database error occurred');
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error('Invalid query parameters');
    }

    throw error;
  }

  static buildSearchQuery(
    searchTerm: string,
    searchFields: string[],
  ): Prisma.JsonObject {
    if (!searchTerm || !searchFields.length) {
      return {};
    }

    return {
      OR: searchFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    };
  }

  static buildDateRangeQuery(
    field: string,
    startDate?: Date | string,
    endDate?: Date | string,
  ): any {
    const query: any = {};

    if (startDate) {
      query[field] = {
        ...(query[field] || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      query[field] = {
        ...(query[field] || {}),
        lte: new Date(endDate),
      };
    }

    return query;
  }
}
