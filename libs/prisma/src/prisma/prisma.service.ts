import { PrismaClient } from '@gen/prisma-client';
import { EnvironmentEnum, LoggerUtil } from '@lib/common';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaTx } from '../types/tx-type';
import { PrismaErrorHandler } from '../utils/error-handler.utils';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly _configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: _configService.get('databaseUrl'),
    });

    const environment = _configService.get<EnvironmentEnum>('environment')!;
    const logPrisma = _configService.get<boolean>('logPrisma')!;

    super({
      adapter,
      log: logPrisma ? LoggerUtil.getPrismaLogger(environment) : [],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Execute a function within a database transaction
   * @param fn Function to execute within transaction
   * @param options Transaction options
   */
  async runTransaction<T>(
    fn: (tx: PrismaTx) => Promise<T>,
    options?: {
      timeout?: number;
      isolationLevel?:
        | 'ReadUncommitted'
        | 'ReadCommitted'
        | 'RepeatableRead'
        | 'Serializable';
    },
  ): Promise<T> {
    try {
      return await this.$transaction(fn, {
        timeout: options?.timeout || 10000, // 10 seconds default
        isolationLevel: options?.isolationLevel,
      });
    } catch (error) {
      PrismaErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Execute a query with error handling
   * @param queryFn Function that returns a Prisma query
   */
  async executeWithErrorHandling<T>(queryFn: () => Promise<T>): Promise<T> {
    try {
      return await queryFn();
    } catch (error) {
      PrismaErrorHandler.handlePrismaError(error);
    }
  }

  /**
   * Check if database is connected
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    connectionCount: number;
    version: string;
    uptime: string;
  }> {
    try {
      const [connectionResult, versionResult, uptimeResult] = await Promise.all(
        [
          this.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
        `,
          this.$queryRaw<
            Array<{ version: string }>
          >`SELECT version() as version`,
          this.$queryRaw<Array<{ uptime: string }>>`
          SELECT extract(epoch from (now() - pg_postmaster_start_time())) as uptime
        `,
        ],
      );

      return {
        connectionCount: Number(connectionResult[0]?.count || 0),
        version: versionResult[0]?.version || 'Unknown',
        uptime: `${Math.floor(Number(uptimeResult[0]?.uptime || 0) / 3600)} hours`,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', error);
      return {
        connectionCount: 0,
        version: 'Unknown',
        uptime: 'Unknown',
      };
    }
  }

  /**
   * Soft delete utility - updates deletedAt field
   * @param model The Prisma model
   * @param where Where clause
   */
  async softDelete<T extends { update: any }>(
    model: T,
    where: any,
  ): Promise<any> {
    return this.executeWithErrorHandling(() =>
      model.update({
        where,
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Bulk operations utility
   */
  async bulkUpsert<T>(
    modelName: string,
    data: Array<{ where: any; create: T; update: Partial<T> }>,
  ): Promise<any[]> {
    return this.runTransaction(async tx => {
      const results = [];
      for (const item of data) {
        const result = await (tx as any)[modelName].upsert(item);
        results.push(result);
      }
      return results;
    });
  }
}
