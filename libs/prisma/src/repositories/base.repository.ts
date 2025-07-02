import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaTx } from "../types/tx-type";

export interface BaseEntity {
  id: number | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Injectable()
export abstract class BaseRepository<T extends BaseEntity, CreateInput, UpdateInput> {
  protected readonly logger = new Logger(this.constructor.name);
  protected abstract modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Create a new record
   */
  async create(data: CreateInput, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].create({ data }),
    );
  }

  /**
   * Find record by ID
   */
  async findById(id: number | string, includeDeleted = false): Promise<T | null> {
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.executeWithErrorHandling(() =>
      (this.prisma as any)[this.modelName].findFirst({ where }),
    );
  }

  /**
   * Find record by ID or throw error
   */
  async findByIdOrThrow(id: number | string, includeDeleted = false): Promise<T> {
    const record = await this.findById(id, includeDeleted);
    if (!record) {
      throw new Error(`${this.modelName} with ID ${id} not found`);
    }
    return record;
  }

  /**
   * Find many records with pagination
   */
  async findMany(
    where: any = {},
    options: PaginationOptions = {},
    includeDeleted = false,
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10, orderBy = "createdAt", orderDirection = "desc" } = options;

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.executeWithErrorHandling(() =>
        (this.prisma as any)[this.modelName].findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
        }),
      ) as Promise<T[]>,
      this.prisma.executeWithErrorHandling(() =>
        (this.prisma as any)[this.modelName].count({ where }),
      ) as Promise<number>,
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update record by ID
   */
  async update(id: number | string, data: UpdateInput, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].update({
        where: { id },
        data,
      }),
    );
  }

  /**
   * Soft delete record by ID
   */
  async softDelete(id: number | string, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Hard delete record by ID
   */
  async delete(id: number | string, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].delete({
        where: { id },
      }),
    );
  }

  /**
   * Restore soft-deleted record
   */
  async restore(id: number | string, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].update({
        where: { id },
        data: { deletedAt: null },
      }),
    );
  }

  /**
   * Upsert record
   */
  async upsert(where: any, create: CreateInput, update: UpdateInput, tx?: PrismaTx): Promise<T> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].upsert({
        where,
        create,
        update,
      }),
    );
  }

  /**
   * Count records
   */
  async count(where: any = {}, includeDeleted = false): Promise<number> {
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.executeWithErrorHandling(() =>
      (this.prisma as any)[this.modelName].count({ where }),
    );
  }

  /**
   * Check if record exists
   */
  async exists(where: any, includeDeleted = false): Promise<boolean> {
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const count = (await this.prisma.executeWithErrorHandling(() =>
      (this.prisma as any)[this.modelName].count({ where }),
    )) as number;

    return count > 0;
  }

  /**
   * Bulk create records
   */
  async createMany(
    data: CreateInput[],
    skipDuplicates = false,
    tx?: PrismaTx,
  ): Promise<{ count: number }> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].createMany({
        data,
        skipDuplicates,
      }),
    );
  }

  /**
   * Bulk update records
   */
  async updateMany(
    where: any,
    data: Partial<UpdateInput>,
    tx?: PrismaTx,
  ): Promise<{ count: number }> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].updateMany({
        where,
        data,
      }),
    );
  }

  /**
   * Bulk soft delete records
   */
  async softDeleteMany(where: any, tx?: PrismaTx): Promise<{ count: number }> {
    const client = tx || this.prisma;
    return this.prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].updateMany({
        where,
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(where: any, includeDeleted = false): Promise<T | null> {
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.executeWithErrorHandling(() =>
      (this.prisma as any)[this.modelName].findFirst({ where }),
    );
  }

  /**
   * Find unique record
   */
  async findUnique(where: any): Promise<T | null> {
    return this.prisma.executeWithErrorHandling(() =>
      (this.prisma as any)[this.modelName].findUnique({ where }),
    );
  }
}
