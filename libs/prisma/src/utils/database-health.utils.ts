import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseConnectionMonitor } from '../utils/database-connection.utils';
import { DatabaseMigrationHelper } from '../utils/database-migration.utils';
import { DatabasePerformanceMonitor } from '../utils/database-performance.utils';

export interface DatabaseHealthReport {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number; // 0-100
    lastChecked: Date;
  };
  connection: {
    isConnected: boolean;
    poolMetrics: any;
    connectionAlerts: any[];
  };
  performance: {
    averageQueryTime: number;
    slowQueryCount: number;
    performanceScore: number;
    recommendations: string[];
  };
  migrations: {
    isUpToDate: boolean;
    migrationCount: number;
    hasUnappliedMigrations: boolean;
  };
  schema: {
    tableCount: number;
    indexCount: number;
    integrityCheck: {
      isValid: boolean;
      issues: string[];
    };
  };
  statistics: {
    databaseSize?: string;
    uptime?: string;
    version: string;
    engine: string;
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  recommendations: string[];
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly performanceMonitor: DatabasePerformanceMonitor,
    private readonly connectionMonitor: DatabaseConnectionMonitor,
    private readonly migrationHelper: DatabaseMigrationHelper,
  ) {}

  /**
   * Get comprehensive database health report
   */
  async getHealthReport(): Promise<DatabaseHealthReport> {
    const startTime = Date.now();

    try {
      // Run all health checks in parallel where possible
      const [
        connectionHealth,
        performanceMetrics,
        migrationStatus,
        schemaInfo,
        databaseStats,
        dbVersion,
      ] = await Promise.allSettled([
        this.getConnectionHealth(),
        this.getPerformanceHealth(),
        this.getMigrationHealth(),
        this.getSchemaHealth(),
        this.getDatabaseStatistics(),
        this.getDatabaseVersion(),
      ]);

      // Process results
      const connectionData = this.getSettledValue(connectionHealth, {
        isConnected: false,
        poolMetrics: {},
        connectionAlerts: [],
      });

      const performanceData = this.getSettledValue(performanceMetrics, {
        averageQueryTime: 0,
        slowQueryCount: 0,
        performanceScore: 0,
        recommendations: [],
      });

      const migrationData = this.getSettledValue(migrationStatus, {
        isUpToDate: false,
        migrationCount: 0,
        hasUnappliedMigrations: true,
      });

      const schemaData = this.getSettledValue(schemaInfo, {
        tableCount: 0,
        indexCount: 0,
        integrityCheck: { isValid: false, issues: ['Health check failed'] },
      });

      const statsData = this.getSettledValue(databaseStats, {});
      const versionData = this.getSettledValue(dbVersion, {
        version: 'unknown',
        engine: 'unknown',
      });

      // Calculate overall score and status
      const { status, score } = this.calculateOverallHealth(
        connectionData,
        performanceData,
        migrationData,
        schemaData,
      );

      // Collect all alerts
      const alerts = this.collectAlerts(
        connectionData,
        performanceData,
        migrationData,
        schemaData,
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        connectionData,
        performanceData,
        migrationData,
        schemaData,
      );

      const checkDuration = Date.now() - startTime;
      this.logger.log(
        `Health check completed in ${checkDuration}ms with status: ${status}`,
      );

      return {
        overall: {
          status,
          score,
          lastChecked: new Date(),
        },
        connection: connectionData,
        performance: performanceData,
        migrations: migrationData,
        schema: schemaData,
        statistics: {
          ...statsData,
          version: versionData.version,
          engine: versionData.engine,
        },
        alerts,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);

      return {
        overall: {
          status: 'critical',
          score: 0,
          lastChecked: new Date(),
        },
        connection: {
          isConnected: false,
          poolMetrics: {},
          connectionAlerts: [],
        },
        performance: {
          averageQueryTime: 0,
          slowQueryCount: 0,
          performanceScore: 0,
          recommendations: [],
        },
        migrations: {
          isUpToDate: false,
          migrationCount: 0,
          hasUnappliedMigrations: true,
        },
        schema: {
          tableCount: 0,
          indexCount: 0,
          integrityCheck: { isValid: false, issues: ['Health check failed'] },
        },
        statistics: { version: 'unknown', engine: 'unknown' },
        alerts: [
          {
            type: 'health_check_failed',
            severity: 'critical',
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          },
        ],
        recommendations: [
          'Database health check failed - investigate connection and configuration',
        ],
      };
    }
  }

  /**
   * Quick health check for simple monitoring
   */
  async quickHealthCheck(): Promise<{
    isHealthy: boolean;
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Simple connection test
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Database is healthy';

      if (responseTime > 1000) {
        status = 'warning';
        message = `Database responding slowly (${responseTime}ms)`;
      } else if (responseTime > 5000) {
        status = 'critical';
        message = `Database response very slow (${responseTime}ms)`;
      }

      return {
        isHealthy: status !== 'critical',
        status,
        message,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: false,
        status: 'critical',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  }

  private async getConnectionHealth(): Promise<any> {
    const isConnected = await this.prisma.isHealthy();
    const poolMetrics = await this.connectionMonitor.getConnectionMetrics();
    const connectionAlerts = this.connectionMonitor.getAlerts(5);

    return {
      isConnected,
      poolMetrics,
      connectionAlerts,
    };
  }

  private async getPerformanceHealth(): Promise<any> {
    const currentMetrics = this.performanceMonitor.getCurrentMetrics();
    const slowQueries = await this.performanceMonitor.getSlowQueries(5);
    const report = this.performanceMonitor.generateReport();

    return {
      averageQueryTime: currentMetrics.averageQueryTime,
      slowQueryCount: currentMetrics.slowQueryCount,
      performanceScore: report.performanceScore,
      recommendations: report.recommendations,
      slowQueries,
    };
  }

  private async getMigrationHealth(): Promise<any> {
    const migrationStatus = await this.migrationHelper.getMigrationStatus();
    const isUpToDate = await this.migrationHelper.areMigrationsUpToDate();

    return {
      isUpToDate,
      migrationCount: migrationStatus.migrations.length,
      hasUnappliedMigrations: migrationStatus.hasUnappliedMigrations,
    };
  }

  private async getSchemaHealth(): Promise<any> {
    const schemaInfo = await this.migrationHelper.getSchemaInfo();
    const integrityCheck = await this.migrationHelper.validateSchemaIntegrity();

    return {
      tableCount: schemaInfo.tables.length,
      indexCount: schemaInfo.indexes.length,
      integrityCheck,
    };
  }

  private async getDatabaseStatistics(): Promise<any> {
    return await this.migrationHelper.getDatabaseStatistics();
  }

  private async getDatabaseVersion(): Promise<any> {
    return await this.migrationHelper.getDatabaseVersion();
  }

  private getSettledValue<T>(
    settled: PromiseSettledResult<T>,
    defaultValue: T,
  ): T {
    return settled.status === 'fulfilled' ? settled.value : defaultValue;
  }

  private calculateOverallHealth(
    connection: any,
    performance: any,
    migration: any,
    schema: any,
  ): { status: 'healthy' | 'warning' | 'critical'; score: number } {
    let score = 100;

    // Connection health (30% weight)
    if (!connection.isConnected) {
      score -= 30;
    } else if (connection.poolMetrics.connectionUtilization > 80) {
      score -= 15;
    }

    // Performance health (25% weight)
    if (performance.performanceScore < 70) {
      score -= (100 - performance.performanceScore) * 0.25;
    }

    // Migration health (25% weight)
    if (!migration.isUpToDate) {
      score -= 25;
    }

    // Schema health (20% weight)
    if (!schema.integrityCheck.isValid) {
      score -= 20;
    }

    score = Math.max(0, Math.round(score));

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 50) {
      status = 'critical';
    } else if (score < 80) {
      status = 'warning';
    }

    return { status, score };
  }

  private collectAlerts(
    connection: any,
    performance: any,
    migration: any,
    schema: any,
  ): any[] {
    const alerts: any[] = [];

    // Connection alerts
    if (connection.connectionAlerts) {
      alerts.push(...connection.connectionAlerts);
    }

    // Performance alerts
    if (performance.slowQueryCount > 0) {
      alerts.push({
        type: 'slow_queries',
        severity: 'medium',
        message: `${performance.slowQueryCount} slow queries detected`,
        timestamp: new Date(),
      });
    }

    // Migration alerts
    if (migration.hasUnappliedMigrations) {
      alerts.push({
        type: 'unapplied_migrations',
        severity: 'high',
        message: 'Database has unapplied migrations',
        timestamp: new Date(),
      });
    }

    // Schema alerts
    if (!schema.integrityCheck.isValid) {
      alerts.push({
        type: 'schema_integrity',
        severity: 'high',
        message: `Schema integrity issues: ${schema.integrityCheck.issues.join(', ')}`,
        timestamp: new Date(),
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return (
        (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
      );
    });
  }

  private generateRecommendations(
    connection: any,
    performance: any,
    migration: any,
    schema: any,
  ): string[] {
    const recommendations: string[] = [];

    if (!connection.isConnected) {
      recommendations.push('Fix database connection issues');
    } else if (connection.poolMetrics.connectionUtilization > 80) {
      recommendations.push('Consider increasing connection pool size');
    }

    if (performance.performanceScore < 70) {
      recommendations.push('Optimize slow queries and consider adding indexes');
    }

    if (migration.hasUnappliedMigrations) {
      recommendations.push('Apply pending database migrations');
    }

    if (!schema.integrityCheck.isValid) {
      recommendations.push('Address schema integrity issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is operating optimally');
    }

    return recommendations;
  }

  /**
   * Start continuous health monitoring
   */
  startContinuousMonitoring(intervalMs = 60000): void {
    this.performanceMonitor.startMonitoring();
    this.connectionMonitor.startMonitoring(intervalMs);

    this.logger.log(
      `Continuous database monitoring started (interval: ${intervalMs}ms)`,
    );
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(): void {
    this.performanceMonitor.stopMonitoring();
    this.connectionMonitor.stopMonitoring();

    this.logger.log('Continuous database monitoring stopped');
  }
}
