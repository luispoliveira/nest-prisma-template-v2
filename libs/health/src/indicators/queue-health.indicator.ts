import {
  EnhancedQueueService,
  QueueDashboardService,
  QueueMonitoringService,
} from '@lib/queue';
import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

export interface QueueHealthDetails {
  queues: Array<{
    name: string;
    status: 'healthy' | 'unhealthy' | 'warning';
    stats: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: number;
      total: number;
    };
    performance?: {
      averageProcessingTime: number;
      throughput: number;
      errorRate: number;
    };
    alerts?: Array<{
      type: string;
      severity: string;
      message: string;
      timestamp: Date;
    }>;
    lastActivity?: Date;
  }>;
  overallStatus: 'healthy' | 'unhealthy' | 'warning';
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  systemMetrics?: {
    memoryUsage: number;
    averageProcessingTime: number;
  };
}

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(QueueHealthIndicator.name);

  constructor(
    private readonly _enhancedQueueService: EnhancedQueueService,
    private readonly _queueMonitoringService: QueueMonitoringService,
    private readonly _queueDashboardService: QueueDashboardService,
  ) {
    super();
  }

  async isHealthy(
    key: string,
    queueNames?: string[],
  ): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      const details = await this.getQueueHealthDetails(queueNames);
      const duration = Date.now() - startTime;

      const isHealthy = details.overallStatus === 'healthy';

      const result = this.getStatus(key, isHealthy, {
        ...details,
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      if (isHealthy) {
        this.logger.debug(
          `Queue health check completed in ${duration}ms - Status: ${details.overallStatus}`,
        );
        return result;
      } else {
        throw new HealthCheckError(
          `Queue health check failed - Status: ${details.overallStatus}`,
          result,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Queue health check failed after ${duration}ms:`,
        error,
      );

      if (error instanceof HealthCheckError) {
        throw error;
      }

      throw new HealthCheckError(
        'Queue health check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          responseTime: `${duration}ms`,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  private async getQueueHealthDetails(
    queueNames?: string[],
  ): Promise<QueueHealthDetails> {
    const details: QueueHealthDetails = {
      queues: [],
      overallStatus: 'healthy',
      totalJobs: 0,
      activeJobs: 0,
      failedJobs: 0,
    };

    try {
      // Get all registered queue names if not specified
      const registeredQueues = queueNames || this.getRegisteredQueueNames();

      if (registeredQueues.length === 0) {
        this.logger.warn('No queues registered for health check');
        details.overallStatus = 'warning';
        return details;
      }

      // Get real-time metrics from dashboard service
      try {
        const realTimeMetrics =
          await this._queueDashboardService.getRealTimeMetrics();
        details.systemMetrics = {
          memoryUsage: realTimeMetrics.memoryUsage,
          averageProcessingTime: realTimeMetrics.averageProcessingTime,
        };
        details.totalJobs = realTimeMetrics.totalJobs;
        details.activeJobs = realTimeMetrics.activeJobs;
      } catch (metricsError) {
        this.logger.warn('Could not fetch real-time metrics:', metricsError);
      }

      // Check health of each queue
      for (const queueName of registeredQueues) {
        const queueHealth = await this.checkSingleQueue(queueName);
        details.queues.push(queueHealth);

        // Update overall totals
        details.totalJobs += queueHealth.stats.total;
        details.activeJobs += queueHealth.stats.active;
        details.failedJobs += queueHealth.stats.failed;
      }

      // Determine overall status
      details.overallStatus = this.determineOverallStatus(details.queues);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error getting queue health details:', errorMessage);
      details.overallStatus = 'unhealthy';
    }

    return details;
  }

  private async checkSingleQueue(
    queueName: string,
  ): Promise<QueueHealthDetails['queues'][0]> {
    const queueHealth: QueueHealthDetails['queues'][0] = {
      name: queueName,
      status: 'healthy',
      stats: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
        total: 0,
      },
    };

    try {
      // Check if queue is healthy (basic connectivity)
      const isQueueHealthy =
        await this._enhancedQueueService.isQueueHealthy(queueName);
      if (!isQueueHealthy) {
        queueHealth.status = 'unhealthy';
        return queueHealth;
      }

      // Get queue statistics
      const stats = await this._enhancedQueueService.getQueueStats(queueName);
      queueHealth.stats = stats;

      // Get performance metrics from monitoring service
      try {
        const performanceMetrics =
          await this._queueMonitoringService.getQueuePerformanceMetricsDetailed(
            queueName,
          );
        queueHealth.performance = {
          averageProcessingTime: performanceMetrics.avgProcessingTime,
          throughput: performanceMetrics.throughput,
          errorRate: performanceMetrics.errorRate,
        };
      } catch (perfError) {
        this.logger.debug(
          `Could not get performance metrics for queue ${queueName}:`,
          perfError,
        );
      }

      // Get alerts from monitoring service
      try {
        const alerts = this._queueMonitoringService.getQueueAlerts(queueName);
        queueHealth.alerts = alerts.map(alert => ({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
        }));
      } catch (alertError) {
        this.logger.debug(
          `Could not get alerts for queue ${queueName}:`,
          alertError,
        );
      }

      // Determine queue status based on metrics and alerts
      queueHealth.status = this.determineQueueStatus(queueHealth);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error checking queue ${queueName}:`, errorMessage);
      queueHealth.status = 'unhealthy';
    }

    return queueHealth;
  }

  private determineQueueStatus(
    queueHealth: QueueHealthDetails['queues'][0],
  ): 'healthy' | 'unhealthy' | 'warning' {
    const { stats, alerts, performance } = queueHealth;

    // Check for critical alerts
    if (alerts && alerts.some(alert => alert.severity === 'critical')) {
      return 'unhealthy';
    }

    // Check for high failure rate
    if (stats.total > 0) {
      const failureRate = stats.failed / stats.total;
      if (failureRate > 0.1) {
        // More than 10% failure rate
        return 'unhealthy';
      } else if (failureRate > 0.05) {
        // More than 5% failure rate
        return 'warning';
      }
    }

    // Check for performance issues
    if (performance) {
      if (performance.errorRate > 0.1) {
        // More than 10% error rate
        return 'unhealthy';
      } else if (performance.errorRate > 0.05) {
        // More than 5% error rate
        return 'warning';
      }

      // Check for slow processing (more than 30 seconds average)
      if (performance.averageProcessingTime > 30000) {
        return 'warning';
      }
    }

    // Check for too many waiting jobs (more than 1000)
    if (stats.waiting > 1000) {
      return 'warning';
    }

    // Check for medium/high severity alerts
    if (
      alerts &&
      alerts.some(alert => ['high', 'medium'].includes(alert.severity))
    ) {
      return 'warning';
    }

    return 'healthy';
  }

  private determineOverallStatus(
    queues: QueueHealthDetails['queues'],
  ): 'healthy' | 'unhealthy' | 'warning' {
    if (queues.length === 0) {
      return 'warning';
    }

    const unhealthyCount = queues.filter(q => q.status === 'unhealthy').length;
    const warningCount = queues.filter(q => q.status === 'warning').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (warningCount > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  private getRegisteredQueueNames(): string[] {
    // This would ideally get the list of registered queues from the EnhancedQueueService
    // For now, we'll return an empty array and let the service handle it
    // In a real implementation, you might want to add a method to EnhancedQueueService
    // to get all registered queue names
    return [];
  }

  async getDetailedQueueReport(): Promise<{
    timestamp: Date;
    summary: {
      totalQueues: number;
      healthyQueues: number;
      unhealthyQueues: number;
      warningQueues: number;
    };
    queues: QueueHealthDetails['queues'];
    systemMetrics: QueueHealthDetails['systemMetrics'];
  }> {
    const details = await this.getQueueHealthDetails();

    return {
      timestamp: new Date(),
      summary: {
        totalQueues: details.queues.length,
        healthyQueues: details.queues.filter(q => q.status === 'healthy')
          .length,
        unhealthyQueues: details.queues.filter(q => q.status === 'unhealthy')
          .length,
        warningQueues: details.queues.filter(q => q.status === 'warning')
          .length,
      },
      queues: details.queues,
      systemMetrics: details.systemMetrics,
    };
  }
}
