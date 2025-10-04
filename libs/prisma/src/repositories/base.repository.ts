import { Logger } from '@nestjs/common';
import { NotFoundError } from '../errors/not-found-error';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTx } from '../types/tx-type';

export interface BaseEntity {
  id: number | string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
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

export abstract class BaseRepository<
  T extends BaseEntity,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
  WhereInput,
> {
  protected readonly logger = new Logger(this.constructor.name);
  protected abstract modelName: string;

  constructor(protected readonly _prisma: PrismaService) {}

  /**
   * Create a new record
   */
  async create(data: CreateInput, tx?: PrismaTx): Promise<T> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].create({ data }),
    );
  }

  /**
   * Find record by ID
   */
  async findById(
    id: number | string,
    includeDeleted = false,
  ): Promise<T | null> {
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this._prisma.executeWithErrorHandling(() =>
      (this._prisma as any)[this.modelName].findFirst({ where }),
    );
  }

  /**
   * Find record by ID or throw error
   */
  async findByIdOrThrow(
    id: number | string,
    includeDeleted = false,
  ): Promise<T> {
    const record = await this.findById(id, includeDeleted);
    if (!record) {
      throw new NotFoundError(`${this.modelName} with ID ${id} not found`);
    }
    return record;
  }

  /**
   * Find many records with pagination
   */
  async findMany(
    where: WhereInput,
    options: PaginationOptions = {},
    includeDeleted = false,
  ): Promise<PaginationResult<T>> {
    const {
      page = 1,
      limit = 10,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options;

    if (!includeDeleted) {
      (where as any).deletedAt = null;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this._prisma.executeWithErrorHandling(() =>
        (this._prisma as any)[this.modelName].findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
        }),
      ) as Promise<T[]>,
      this._prisma.executeWithErrorHandling(() =>
        (this._prisma as any)[this.modelName].count({ where }),
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
  async update(
    id: number | string,
    data: UpdateInput,
    tx?: PrismaTx,
  ): Promise<T> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
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
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
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
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].delete({
        where: { id },
      }),
    );
  }

  /**
   * Restore soft-deleted record
   */
  async restore(id: number | string, tx?: PrismaTx): Promise<T> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].update({
        where: { id },
        data: { deletedAt: null },
      }),
    );
  }

  /**
   * Upsert record
   */
  async upsert(
    where: WhereUniqueInput,
    create: CreateInput,
    update: UpdateInput,
    tx?: PrismaTx,
  ): Promise<T> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
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
  async count(where: WhereInput, includeDeleted = false): Promise<number> {
    if (!includeDeleted) {
      (where as any).deletedAt = null;
    }

    return this._prisma.executeWithErrorHandling(() =>
      (this._prisma as any)[this.modelName].count({ where }),
    );
  }

  /**
   * Check if record exists
   */
  async exists(where: WhereInput, includeDeleted = false): Promise<boolean> {
    if (!includeDeleted) {
      (where as any).deletedAt = null;
    }

    const count = (await this._prisma.executeWithErrorHandling(() =>
      (this._prisma as any)[this.modelName].count({ where }),
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
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
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
    where: WhereInput,
    data: Partial<UpdateInput>,
    tx?: PrismaTx,
  ): Promise<{ count: number }> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].updateMany({
        where,
        data,
      }),
    );
  }

  /**
   * Bulk soft delete records
   */
  async softDeleteMany(
    where: WhereInput,
    tx?: PrismaTx,
  ): Promise<{ count: number }> {
    const client = tx || this._prisma;
    return this._prisma.executeWithErrorHandling(() =>
      (client as any)[this.modelName].updateMany({
        where,
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(
    where: WhereInput,
    includeDeleted = false,
  ): Promise<T | null> {
    if (!includeDeleted) {
      (where as any).deletedAt = null;
    }

    return this._prisma.executeWithErrorHandling(() =>
      (this._prisma as any)[this.modelName].findFirst({ where }),
    );
  }

  /**
   * Find unique record
   */
  async findUnique(
    where: WhereUniqueInput,
    includeDeleted = false,
  ): Promise<T | null> {
    const record = (await this._prisma.executeWithErrorHandling(() =>
      (this._prisma as any)[this.modelName].findUnique({ where }),
    )) as T | null;

    if (!includeDeleted && record && record.deletedAt) {
      return null;
    }

    return record;
  }

  /**
   * Find unique record or throw error
   */
  async findUniqueOrThrow(
    where: WhereUniqueInput,
    includeDeleted = false,
  ): Promise<T> {
    const record = await this.findUnique(where, includeDeleted);
    if (!record) {
      throw new NotFoundError(
        `${this.modelName} with where clause ${JSON.stringify(where)} not found`,
      );
    }
    return record;
  }
}
