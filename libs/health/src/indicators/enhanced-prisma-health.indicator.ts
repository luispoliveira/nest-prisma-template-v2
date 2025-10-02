import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export interface PrismaHealthDetails {
  connectionCount: number;
  activeQueries: number;
  databaseSize?: string;
  uptime?: number;
  version?: string;
  slowQueries?: Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }>;
  migrationStatus?: {
    current: string;
    pending: number;
    lastMigration?: Date;
  };
}

@Injectable()
export class EnhancedPrismaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(EnhancedPrismaHealthIndicator.name);

  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Basic connection test
      const _connectionTest = await this.testConnection();

      // Get detailed database information
      const details = await this.getDatabaseDetails();

      const duration = Date.now() - startTime;

      const result = this.getStatus(key, true, {
        ...details,
        responseTime: `${duration}ms`,
        status: 'connected',
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(`Prisma health check completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Prisma health check failed after ${duration}ms:`,
        error,
      );

      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          responseTime: `${duration}ms`,
          status: 'disconnected',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private async testConnection(): Promise<void> {
    // Test basic connection with a simple query
    await this._prismaService.$queryRaw`SELECT 1`;
  }

  private async getDatabaseDetails(): Promise<PrismaHealthDetails> {
    const details: PrismaHealthDetails = {
      connectionCount: 0,
      activeQueries: 0,
    };

    try {
      // Get database version
      const versionResult = await this._prismaService.$queryRaw<
        Array<{ version: string }>
      >`
        SELECT version() as version
      `;
      if (versionResult.length > 0) {
        details.version = versionResult[0].version;
      }

      // Get database size
      const sizeResult = await this._prismaService.$queryRaw<
        Array<{ size: string }>
      >`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      if (sizeResult.length > 0) {
        details.databaseSize = sizeResult[0].size;
      }

      // Get connection count
      const connectionResult = await this._prismaService.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      if (connectionResult.length > 0) {
        details.connectionCount = Number(connectionResult[0].count);
      }

      // Get database uptime
      const uptimeResult = await this._prismaService.$queryRaw<
        Array<{ uptime: Date }>
      >`
        SELECT pg_postmaster_start_time() as uptime
      `;
      if (uptimeResult.length > 0) {
        const startTime = new Date(uptimeResult[0].uptime);
        details.uptime = Date.now() - startTime.getTime();
      }

      // Check for slow queries (queries running longer than 5 seconds)
      const slowQueriesResult = await this._prismaService.$queryRaw<
        Array<{
          query: string;
          duration: number;
          query_start: Date;
        }>
      >`
        SELECT 
          query,
          EXTRACT(EPOCH FROM (now() - query_start)) as duration,
          query_start
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query_start < now() - interval '5 seconds'
        AND query NOT LIKE '%pg_stat_activity%'
        LIMIT 10
      `;

      details.slowQueries = slowQueriesResult.map(row => ({
        query: row.query.substring(0, 100) + '...', // Truncate long queries
        duration: Math.round(row.duration * 1000), // Convert to milliseconds
        timestamp: row.query_start,
      }));

      // Check migration status by querying the _prisma_migrations table
      try {
        const migrationResult = await this._prismaService.$queryRaw<
          Array<{
            migration_name: string;
            finished_at: Date | null;
          }>
        >`
          SELECT migration_name, finished_at 
          FROM _prisma_migrations 
          ORDER BY started_at DESC 
          LIMIT 10
        `;

        const completedMigrations = migrationResult.filter(
          m => m.finished_at !== null,
        );
        const pendingMigrations = migrationResult.filter(
          m => m.finished_at === null,
        );

        details.migrationStatus = {
          current:
            completedMigrations.length > 0
              ? completedMigrations[0].migration_name
              : 'none',
          pending: pendingMigrations.length,
          lastMigration:
            completedMigrations.length > 0
              ? completedMigrations[0].finished_at || undefined
              : undefined,
        };
      } catch (migrationError) {
        // Migration table might not exist, which is fine
        const errorMessage =
          migrationError instanceof Error
            ? migrationError.message
            : 'Unknown error';
        this.logger.debug('Could not check migration status:', errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        'Could not fetch detailed database information:',
        errorMessage,
      );
    }

    return details;
  }

  async getConnectionPoolStats(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    maxConnections: number;
  }> {
    try {
      const result = await this._prismaService.$queryRaw<
        Array<{
          active: bigint;
          idle: bigint;
          total: bigint;
          max_conn: bigint;
        }>
      >`
        SELECT 
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) as total,
          setting::int as max_conn
        FROM pg_stat_activity, pg_settings 
        WHERE name = 'max_connections'
        GROUP BY setting
      `;

      if (result.length > 0) {
        const stats = result[0];
        return {
          activeConnections: Number(stats.active),
          idleConnections: Number(stats.idle),
          totalConnections: Number(stats.total),
          maxConnections: Number(stats.max_conn),
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Could not fetch connection pool stats:', errorMessage);
    }

    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 0,
    };
  }
}
