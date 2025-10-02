import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  connectionUtilization: number; // percentage
  averageWaitTime?: number;
  connectionErrors: number;
  lastConnectionError?: Date;
}

export interface ConnectionPoolAlert {
  type:
    | 'high_utilization'
    | 'connection_error'
    | 'pool_exhausted'
    | 'long_wait_time';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metrics?: Partial<ConnectionPoolMetrics>;
}

@Injectable()
export class DatabaseConnectionMonitor {
  private readonly logger = new Logger(DatabaseConnectionMonitor.name);
  private alerts: ConnectionPoolAlert[] = [];
  private readonly maxAlerts = 100;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start continuous connection monitoring
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) {
      this.logger.warn('Connection monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.log(
      `Starting connection pool monitoring (interval: ${intervalMs}ms)`,
    );

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkConnectionHealth();
      } catch (error) {
        this.logger.error('Error during connection monitoring', error);
      }
    }, intervalMs);
  }

  /**
   * Stop connection monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    this.logger.log('Connection pool monitoring stopped');
  }

  /**
   * Get current connection pool metrics
   */
  async getConnectionMetrics(): Promise<ConnectionPoolMetrics> {
    try {
      const dbEngine = await this.getDatabaseEngine();

      if (dbEngine === 'postgresql') {
        return await this.getPostgreSQLConnectionMetrics();
      } else if (dbEngine === 'mysql') {
        return await this.getMySQLConnectionMetrics();
      } else {
        // Fallback basic metrics
        return this.getBasicConnectionMetrics();
      }
    } catch (error) {
      this.logger.error('Failed to get connection metrics', error);
      return this.getBasicConnectionMetrics();
    }
  }

  private async getDatabaseEngine(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT version()`;
      return 'postgresql';
    } catch (error) {
      try {
        await this.prisma.$queryRaw`SELECT VERSION()`;
        return 'mysql';
      } catch (mysqlError) {
        return 'unknown';
      }
    }
  }

  private async getPostgreSQLConnectionMetrics(): Promise<ConnectionPoolMetrics> {
    try {
      // Get connection stats from pg_stat_activity
      const connectionStats = await this.prisma.$queryRaw<
        {
          total: number;
          active: number;
          idle: number;
        }[]
      >`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN state = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      // Get max connections setting
      const maxConnectionsResult = await this.prisma.$queryRaw<
        {
          setting: string;
        }[]
      >`
        SELECT setting FROM pg_settings WHERE name = 'max_connections'
      `;

      const stats = connectionStats[0];
      const maxConnections = parseInt(
        maxConnectionsResult[0]?.setting || '100',
      );

      return {
        activeConnections: stats?.active || 0,
        idleConnections: stats?.idle || 0,
        totalConnections: stats?.total || 0,
        maxConnections,
        connectionUtilization: ((stats?.total || 0) / maxConnections) * 100,
        connectionErrors: 0, // Would need to track this separately
      };
    } catch (error) {
      this.logger.warn('Could not get PostgreSQL connection metrics', error);
      return this.getBasicConnectionMetrics();
    }
  }

  private async getMySQLConnectionMetrics(): Promise<ConnectionPoolMetrics> {
    try {
      // Get connection stats
      const connectionStats = await this.prisma.$queryRaw<
        {
          Variable_name: string;
          Value: string;
        }[]
      >`
        SHOW STATUS WHERE Variable_name IN (
          'Threads_connected', 
          'Threads_running', 
          'Max_used_connections'
        )
      `;

      const maxConnectionsResult = await this.prisma.$queryRaw<
        {
          Variable_name: string;
          Value: string;
        }[]
      >`
        SHOW VARIABLES WHERE Variable_name = 'max_connections'
      `;

      const statsMap = connectionStats.reduce(
        (acc, stat) => {
          acc[stat.Variable_name] = parseInt(stat.Value);
          return acc;
        },
        {} as Record<string, number>,
      );

      const maxConnections = parseInt(maxConnectionsResult[0]?.Value || '100');
      const totalConnections = statsMap['Threads_connected'] || 0;
      const activeConnections = statsMap['Threads_running'] || 0;

      return {
        activeConnections,
        idleConnections: totalConnections - activeConnections,
        totalConnections,
        maxConnections,
        connectionUtilization: (totalConnections / maxConnections) * 100,
        connectionErrors: 0,
      };
    } catch (error) {
      this.logger.warn('Could not get MySQL connection metrics', error);
      return this.getBasicConnectionMetrics();
    }
  }

  private getBasicConnectionMetrics(): ConnectionPoolMetrics {
    // Basic fallback metrics
    return {
      activeConnections: 1,
      idleConnections: 0,
      totalConnections: 1,
      maxConnections: 10,
      connectionUtilization: 10,
      connectionErrors: 0,
    };
  }

  /**
   * Check connection health and generate alerts
   */
  private async checkConnectionHealth(): Promise<void> {
    try {
      const metrics = await this.getConnectionMetrics();

      // Check for high utilization
      if (metrics.connectionUtilization > 80) {
        this.addAlert({
          type: 'high_utilization',
          message: `Connection pool utilization is high: ${metrics.connectionUtilization.toFixed(1)}%`,
          severity: metrics.connectionUtilization > 95 ? 'critical' : 'high',
          timestamp: new Date(),
          metrics,
        });
      }

      // Check for pool exhaustion
      if (metrics.totalConnections >= metrics.maxConnections) {
        this.addAlert({
          type: 'pool_exhausted',
          message: 'Connection pool is exhausted',
          severity: 'critical',
          timestamp: new Date(),
          metrics,
        });
      }

      // Test connection by executing a simple query
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - startTime;

      // Check for slow connections
      if (connectionTime > 5000) {
        // 5 seconds
        this.addAlert({
          type: 'long_wait_time',
          message: `Connection acquisition took ${connectionTime}ms`,
          severity: 'medium',
          timestamp: new Date(),
          metrics: { ...metrics, averageWaitTime: connectionTime },
        });
      }
    } catch (error) {
      this.addAlert({
        type: 'connection_error',
        message: `Connection health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Add an alert to the alerts history
   */
  private addAlert(alert: ConnectionPoolAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log alert based on severity
    const logMessage = `[${alert.type}] ${alert.message}`;
    switch (alert.severity) {
      case 'critical':
        this.logger.error(logMessage);
        break;
      case 'high':
        this.logger.warn(logMessage);
        break;
      case 'medium':
        this.logger.log(logMessage);
        break;
      case 'low':
        this.logger.debug(logMessage);
        break;
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit?: number): ConnectionPoolAlert[] {
    const alerts = [...this.alerts].reverse(); // Most recent first
    return limit ? alerts.slice(0, limit) : alerts;
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(
    severity: ConnectionPoolAlert['severity'],
  ): ConnectionPoolAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.logger.log('Connection alerts cleared');
  }

  /**
   * Get connection health summary
   */
  async getHealthSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: ConnectionPoolMetrics;
    recentAlerts: ConnectionPoolAlert[];
    recommendations: string[];
  }> {
    const metrics = await this.getConnectionMetrics();
    const recentAlerts = this.getAlerts(5);
    const criticalAlerts = this.getAlertsBySeverity('critical');
    const highAlerts = this.getAlertsBySeverity('high');

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (highAlerts.length > 0 || metrics.connectionUtilization > 70) {
      status = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (metrics.connectionUtilization > 80) {
      recommendations.push('Consider increasing the connection pool size');
    }

    if (metrics.connectionUtilization > 50) {
      recommendations.push(
        'Monitor connection usage patterns and optimize queries',
      );
    }

    if (criticalAlerts.length > 0) {
      recommendations.push('Address critical connection issues immediately');
    }

    if (recommendations.length === 0) {
      recommendations.push('Connection pool is operating normally');
    }

    return {
      status,
      metrics,
      recentAlerts,
      recommendations,
    };
  }

  /**
   * Test connection performance
   */
  async testConnectionPerformance(iterations = 10): Promise<{
    averageConnectionTime: number;
    minConnectionTime: number;
    maxConnectionTime: number;
    successfulConnections: number;
    failedConnections: number;
  }> {
    const times: number[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        const duration = Date.now() - startTime;
        times.push(duration);
        successful++;
      } catch (error) {
        failed++;
        this.logger.warn(`Connection test ${i + 1} failed`, error);
      }
    }

    const averageConnectionTime =
      times.length > 0
        ? times.reduce((sum, time) => sum + time, 0) / times.length
        : 0;

    return {
      averageConnectionTime,
      minConnectionTime: times.length > 0 ? Math.min(...times) : 0,
      maxConnectionTime: times.length > 0 ? Math.max(...times) : 0,
      successfulConnections: successful,
      failedConnections: failed,
    };
  }

  /**
   * Get connection pool configuration recommendations
   */
  async getConfigurationRecommendations(): Promise<{
    currentConfig: Record<string, any>;
    recommendations: Record<
      string,
      { current: any; recommended: any; reason: string }
    >;
  }> {
    const metrics = await this.getConnectionMetrics();
    const dbEngine = await this.getDatabaseEngine();

    const currentConfig: Record<string, any> = {
      maxConnections: metrics.maxConnections,
      currentUtilization: `${metrics.connectionUtilization.toFixed(1)}%`,
    };

    const recommendations: Record<
      string,
      { current: any; recommended: any; reason: string }
    > = {};

    // Connection pool size recommendations
    if (metrics.connectionUtilization > 80) {
      recommendations.maxConnections = {
        current: metrics.maxConnections,
        recommended: Math.ceil(metrics.maxConnections * 1.5),
        reason: 'High connection utilization detected',
      };
    }

    // Database-specific recommendations
    if (dbEngine === 'postgresql') {
      // Add PostgreSQL-specific recommendations
      recommendations.sharedBuffers = {
        current: 'Unknown',
        recommended: '25% of RAM',
        reason: 'Optimize PostgreSQL memory usage',
      };
    } else if (dbEngine === 'mysql') {
      // Add MySQL-specific recommendations
      recommendations.innodbBufferPoolSize = {
        current: 'Unknown',
        recommended: '70% of RAM',
        reason: 'Optimize MySQL InnoDB buffer pool',
      };
    }

    return {
      currentConfig,
      recommendations,
    };
  }

  /**
   * Cleanup when service is destroyed
   */
  onModuleDestroy(): void {
    this.stopMonitoring();
  }
}
