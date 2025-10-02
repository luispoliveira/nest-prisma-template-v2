import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QueryPerformanceMetric {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
  model?: string;
  operation?: string;
}

export interface PerformanceReport {
  totalQueries: number;
  averageQueryTime: number;
  slowestQueries: QueryPerformanceMetric[];
  queryDistribution: Record<string, number>;
  performanceScore: number;
  recommendations: string[];
}

export interface DatabasePerformanceStats {
  connectionCount?: number;
  activeQueries?: number;
  locksCount?: number;
  cacheHitRatio?: number;
  indexUsage?: any[];
  tableStats?: any[];
}

@Injectable()
export class DatabasePerformanceMonitor {
  private readonly logger = new Logger(DatabasePerformanceMonitor.name);
  private queryMetrics: QueryPerformanceMetric[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly slowQueryThreshold = 1000; // ms

  constructor(private readonly _prisma: PrismaService) {}

  /**
   * Start monitoring query performance
   */
  startMonitoring(): void {
    // Clear existing metrics
    this.queryMetrics = [];

    this.logger.log('Performance monitoring started');
  }

  /**
   * Stop monitoring and return report
   */
  stopMonitoring(): PerformanceReport {
    const report = this.generateReport();
    this.queryMetrics = [];

    this.logger.log('Performance monitoring stopped');
    return report;
  }

  /**
   * Record a query metric
   */
  recordQuery(metric: QueryPerformanceMetric): void {
    this.queryMetrics.push(metric);

    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
    }

    // Log slow queries
    if (metric.duration > this.slowQueryThreshold) {
      this.logger.warn(
        `Slow query detected: ${metric.duration}ms - ${metric.query}`,
      );
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowestQueries: [],
        queryDistribution: {},
        performanceScore: 100,
        recommendations: ['No queries recorded'],
      };
    }

    const totalQueries = this.queryMetrics.length;
    const totalTime = this.queryMetrics.reduce(
      (sum, metric) => sum + metric.duration,
      0,
    );
    const averageQueryTime = totalTime / totalQueries;

    // Get slowest queries
    const slowestQueries = [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Query distribution by operation
    const queryDistribution: Record<string, number> = {};
    this.queryMetrics.forEach(metric => {
      const operation = metric.operation || 'unknown';
      queryDistribution[operation] = (queryDistribution[operation] || 0) + 1;
    });

    // Calculate performance score (0-100)
    const performanceScore = this.calculatePerformanceScore();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      totalQueries,
      averageQueryTime,
      slowestQueries,
      queryDistribution,
      performanceScore,
      recommendations,
    };
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(): number {
    if (this.queryMetrics.length === 0) return 100;

    const averageTime =
      this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) /
      this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter(
      m => m.duration > this.slowQueryThreshold,
    ).length;
    const slowQueryRatio = slowQueries / this.queryMetrics.length;

    // Base score
    let score = 100;

    // Deduct for average query time
    if (averageTime > 100) score -= Math.min(30, (averageTime - 100) / 10);

    // Deduct for slow query ratio
    score -= slowQueryRatio * 40;

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.queryMetrics.length === 0) {
      return ['No data available for recommendations'];
    }

    const averageTime =
      this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) /
      this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter(
      m => m.duration > this.slowQueryThreshold,
    );

    if (averageTime > 200) {
      recommendations.push(
        'Average query time is high. Consider adding database indexes.',
      );
    }

    if (slowQueries.length > 0) {
      recommendations.push(
        `${slowQueries.length} slow queries detected. Review and optimize these queries.`,
      );
    }

    const selectQueries = this.queryMetrics.filter(
      m => m.operation === 'findMany' || m.operation === 'findFirst',
    );
    if (selectQueries.length > this.queryMetrics.length * 0.8) {
      recommendations.push(
        'High ratio of SELECT queries. Consider implementing caching.',
      );
    }

    const updateQueries = this.queryMetrics.filter(
      m => m.operation === 'update' || m.operation === 'updateMany',
    );
    if (updateQueries.some(q => q.duration > 500)) {
      recommendations.push(
        'Slow UPDATE queries detected. Consider optimizing WHERE clauses and indexes.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Database performance is good. Continue monitoring.',
      );
    }

    return recommendations;
  }

  /**
   * Get database performance statistics
   */
  async getDatabaseStats(): Promise<DatabasePerformanceStats> {
    try {
      const stats: DatabasePerformanceStats = {};

      // Try to get database-specific stats
      const dbVersion = await this.getDatabaseEngine();

      if (dbVersion === 'postgresql') {
        await this.getPostgreSQLStats(stats);
      } else if (dbVersion === 'mysql') {
        await this.getMySQLStats(stats);
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get database stats', error);
      return {};
    }
  }

  private async getDatabaseEngine(): Promise<string> {
    try {
      await this._prisma.$queryRaw`SELECT version()`;
      return 'postgresql';
    } catch {
      try {
        await this._prisma.$queryRaw`SELECT VERSION()`;
        return 'mysql';
      } catch {
        return 'unknown';
      }
    }
  }

  private async getPostgreSQLStats(
    stats: DatabasePerformanceStats,
  ): Promise<void> {
    try {
      // Connection count
      const connections = await this._prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*) as count FROM pg_stat_activity
      `;
      stats.connectionCount = connections[0]?.count || 0;

      // Active queries
      const activeQueries = await this._prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
      `;
      stats.activeQueries = activeQueries[0]?.count || 0;

      // Index usage stats
      const indexStats = await this._prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC
        LIMIT 10
      `;
      stats.indexUsage = indexStats;

      // Table stats
      const tableStats = await this._prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;
      stats.tableStats = tableStats;
    } catch (error) {
      this.logger.warn('Could not get PostgreSQL stats', error);
    }
  }

  private async getMySQLStats(stats: DatabasePerformanceStats): Promise<void> {
    try {
      // Connection count
      const connections = await this._prisma.$queryRaw<
        { Variable_name: string; Value: string }[]
      >`
        SHOW STATUS LIKE 'Threads_connected'
      `;
      stats.connectionCount = parseInt(connections[0]?.Value || '0');

      // Active queries
      const processlist = await this._prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND != 'Sleep'
      `;
      stats.activeQueries = processlist[0]?.count || 0;

      // Index usage (simplified)
      const indexStats = await this._prisma.$queryRaw<any[]>`
        SELECT 
          TABLE_SCHEMA,
          TABLE_NAME,
          INDEX_NAME,
          CARDINALITY
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY CARDINALITY DESC
        LIMIT 10
      `;
      stats.indexUsage = indexStats;
    } catch (error) {
      this.logger.warn('Could not get MySQL stats', error);
    }
  }

  /**
   * Get slow query log
   */
  async getSlowQueries(limit = 10): Promise<QueryPerformanceMetric[]> {
    return [...this.queryMetrics]
      .filter(metric => metric.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.queryMetrics = [];
    this.logger.log('Performance metrics cleared');
  }

  /**
   * Get current metrics summary
   */
  getCurrentMetrics(): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueryCount: number;
    recentQueries: QueryPerformanceMetric[];
  } {
    const recentQueries = this.queryMetrics.slice(-10);
    const slowQueryCount = this.queryMetrics.filter(
      m => m.duration > this.slowQueryThreshold,
    ).length;
    const averageQueryTime =
      this.queryMetrics.length > 0
        ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) /
          this.queryMetrics.length
        : 0;

    return {
      totalQueries: this.queryMetrics.length,
      averageQueryTime,
      slowQueryCount,
      recentQueries,
    };
  }

  /**
   * Monitor a specific function's database performance
   */
  async monitorFunction<T>(
    fn: () => Promise<T>,
    context: { operation?: string; model?: string } = {},
  ): Promise<{ result: T; metrics: QueryPerformanceMetric }> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      const metric: QueryPerformanceMetric = {
        query: context.operation || 'function_execution',
        duration,
        timestamp: new Date(),
        operation: context.operation,
        model: context.model,
      };

      this.recordQuery(metric);

      return { result, metrics: metric };
    } catch (error) {
      const duration = Date.now() - startTime;

      const metric: QueryPerformanceMetric = {
        query: `${context.operation || 'function_execution'}_ERROR`,
        duration,
        timestamp: new Date(),
        operation: context.operation,
        model: context.model,
      };

      this.recordQuery(metric);
      throw error;
    }
  }
}
