import { Injectable, Logger } from '@nestjs/common';
import { JobMetrics } from '../interfaces/job.interface';
import {
  QueueHealthCheck,
  QueueHealthStatus,
  SystemQueueHealth,
} from '../interfaces/queue-health.interface';
import { QueuePerformanceMetrics } from '../interfaces/queue-stats.interface';
import { EnhancedQueueService, QueueStats } from './enhanced-queue.service';

export interface QueueHealthMetric {
  queueName: string;
  isHealthy: boolean;
  stats: QueueStats;
  performance: {
    avgProcessingTime: number;
    throughput: number; // jobs per minute
    errorRate: number; // percentage
  };
  alerts: QueueAlert[];
  lastChecked: Date;
}

export interface QueueAlert {
  type:
    | 'high_queue_size'
    | 'high_error_rate'
    | 'stalled_jobs'
    | 'connection_error'
    | 'low_throughput';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  queueName: string;
  metadata?: any;
}

export interface QueuePerformanceMetric {
  queueName: string;
  jobName: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  attempts: number;
  errorMessage?: string;
}

export interface QueueMonitoringReport {
  summary: {
    totalQueues: number;
    healthyQueues: number;
    totalJobs: number;
    activeJobs: number;
    failedJobs: number;
    avgThroughput: number;
    overallHealth: 'healthy' | 'warning' | 'critical';
  };
  queues: QueueHealthMetric[];
  recentAlerts: QueueAlert[];
  recommendations: string[];
  lastUpdated: Date;
}

@Injectable()
export class QueueMonitoringService {
  private readonly logger = new Logger(QueueMonitoringService.name);
  private performanceMetrics: QueuePerformanceMetric[] = [];
  private alerts: QueueAlert[] = [];
  private readonly maxMetricsHistory = 1000;
  private readonly maxAlertsHistory = 100;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private readonly queueService: EnhancedQueueService) {}

  /**
   * Start monitoring all queues
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.isMonitoring) {
      this.logger.warn('Queue monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.log(`Starting queue monitoring (interval: ${intervalMs}ms)`);

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.logger.error('Error during queue monitoring', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.isMonitoring = false;
    this.logger.log('Queue monitoring stopped');
  }

  /**
   * Record a job performance metric
   */
  recordJobMetric(metric: QueuePerformanceMetric): void {
    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics = this.performanceMetrics.slice(
        -this.maxMetricsHistory,
      );
    }

    // Analyze for potential alerts
    this.analyzeMetricForAlerts(metric);
  }

  /**
   * Get comprehensive monitoring report
   */
  async getMonitoringReport(): Promise<QueueMonitoringReport> {
    const queueNames = this.queueService.getQueueNames();
    const queueMetrics: QueueHealthMetric[] = [];

    let totalJobs = 0;
    let activeJobs = 0;
    let failedJobs = 0;
    let healthyQueues = 0;

    for (const queueName of queueNames) {
      try {
        const metric = await this.getQueueHealthMetric(queueName);
        queueMetrics.push(metric);

        totalJobs += metric.stats.total;
        activeJobs += metric.stats.active;
        failedJobs += metric.stats.failed;

        if (metric.isHealthy) {
          healthyQueues++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to get metrics for queue '${queueName}'`,
          error,
        );
      }
    }

    const avgThroughput = this.calculateAverageThroughput();
    const overallHealth = this.determineOverallHealth(queueMetrics);
    const recentAlerts = this.getRecentAlerts(10);
    const recommendations = this.generateRecommendations(
      queueMetrics,
      recentAlerts,
    );

    return {
      summary: {
        totalQueues: queueNames.length,
        healthyQueues,
        totalJobs,
        activeJobs,
        failedJobs,
        avgThroughput,
        overallHealth,
      },
      queues: queueMetrics,
      recentAlerts,
      recommendations,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get health metrics for a specific queue
   */
  async getQueueHealthMetric(queueName: string): Promise<QueueHealthMetric> {
    const stats = await this.queueService.getQueueStats(queueName);
    const isHealthy = await this.queueService.isQueueHealthy(queueName);
    const performance = this.calculateQueuePerformance(queueName);
    const queueAlerts = this.getQueueAlerts(queueName);

    return {
      queueName,
      isHealthy,
      stats,
      performance,
      alerts: queueAlerts,
      lastChecked: new Date(),
    };
  }

  /**
   * Get alerts for a specific queue
   */
  getQueueAlerts(queueName: string, limit?: number): QueueAlert[] {
    const queueAlerts = this.alerts
      .filter(alert => alert.queueName === queueName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? queueAlerts.slice(0, limit) : queueAlerts;
  }

  /**
   * Get recent alerts across all queues
   */
  getRecentAlerts(limit = 20): QueueAlert[] {
    return [...this.alerts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: QueueAlert['severity']): QueueAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear alerts
   */
  clearAlerts(queueName?: string): void {
    if (queueName) {
      this.alerts = this.alerts.filter(alert => alert.queueName !== queueName);
      this.logger.log(`Alerts cleared for queue '${queueName}'`);
    } else {
      this.alerts = [];
      this.logger.log('All alerts cleared');
    }
  }

  /**
   * Get performance metrics for a queue
   */
  getQueuePerformanceMetrics(
    queueName: string,
    hours = 24,
  ): QueuePerformanceMetric[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.performanceMetrics.filter(
      metric => metric.queueName === queueName && metric.timestamp >= cutoff,
    );
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(queueName?: string): void {
    if (queueName) {
      this.performanceMetrics = this.performanceMetrics.filter(
        metric => metric.queueName !== queueName,
      );
      this.logger.log(`Metrics cleared for queue '${queueName}'`);
    } else {
      this.performanceMetrics = [];
      this.logger.log('All metrics cleared');
    }
  }

  /**
   * Perform health checks for all queues
   */
  private async performHealthChecks(): Promise<void> {
    const queueNames = this.queueService.getQueueNames();

    for (const queueName of queueNames) {
      try {
        await this.checkQueueHealth(queueName);
      } catch (error) {
        this.addAlert({
          type: 'connection_error',
          severity: 'high',
          message: `Health check failed for queue '${queueName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          queueName,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }
  }

  /**
   * Check health of a specific queue
   */
  private async checkQueueHealth(queueName: string): Promise<void> {
    const stats = await this.queueService.getQueueStats(queueName);
    const isHealthy = await this.queueService.isQueueHealthy(queueName);

    // Check for high queue size
    if (stats.waiting > 1000) {
      this.addAlert({
        type: 'high_queue_size',
        severity: stats.waiting > 5000 ? 'critical' : 'high',
        message: `High queue size detected: ${stats.waiting} waiting jobs`,
        timestamp: new Date(),
        queueName,
        metadata: { waitingJobs: stats.waiting },
      });
    }

    // Check for high failure rate
    const totalProcessed = stats.completed + stats.failed;
    if (totalProcessed > 0) {
      const errorRate = (stats.failed / totalProcessed) * 100;
      if (errorRate > 10) {
        this.addAlert({
          type: 'high_error_rate',
          severity: errorRate > 25 ? 'critical' : 'medium',
          message: `High error rate detected: ${errorRate.toFixed(1)}%`,
          timestamp: new Date(),
          queueName,
          metadata: { errorRate, failedJobs: stats.failed, totalProcessed },
        });
      }
    }

    // Check connection health
    if (!isHealthy) {
      this.addAlert({
        type: 'connection_error',
        severity: 'critical',
        message: `Queue connection unhealthy`,
        timestamp: new Date(),
        queueName,
      });
    }

    // Check for low throughput
    const performance = this.calculateQueuePerformance(queueName);
    if (performance.throughput < 1 && stats.waiting > 10) {
      this.addAlert({
        type: 'low_throughput',
        severity: 'medium',
        message: `Low throughput detected: ${performance.throughput.toFixed(2)} jobs/min`,
        timestamp: new Date(),
        queueName,
        metadata: {
          throughput: performance.throughput,
          waitingJobs: stats.waiting,
        },
      });
    }
  }

  /**
   * Calculate performance metrics for a queue
   */
  private calculateQueuePerformance(queueName: string): {
    avgProcessingTime: number;
    throughput: number;
    errorRate: number;
  } {
    const recentMetrics = this.getQueuePerformanceMetrics(queueName, 1); // Last hour

    if (recentMetrics.length === 0) {
      return {
        avgProcessingTime: 0,
        throughput: 0,
        errorRate: 0,
      };
    }

    const avgProcessingTime =
      recentMetrics.reduce((sum, metric) => sum + metric.duration, 0) /
      recentMetrics.length;
    const throughput = recentMetrics.length / 60; // jobs per minute
    const failedJobs = recentMetrics.filter(metric => !metric.success).length;
    const errorRate = (failedJobs / recentMetrics.length) * 100;

    return {
      avgProcessingTime,
      throughput,
      errorRate,
    };
  }

  /**
   * Calculate average throughput across all queues
   */
  private calculateAverageThroughput(): number {
    const queueNames = this.queueService.getQueueNames();
    if (queueNames.length === 0) return 0;

    const totalThroughput = queueNames.reduce((sum, queueName) => {
      const performance = this.calculateQueuePerformance(queueName);
      return sum + performance.throughput;
    }, 0);

    return totalThroughput / queueNames.length;
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    queueMetrics: QueueHealthMetric[],
  ): 'healthy' | 'warning' | 'critical' {
    if (queueMetrics.length === 0) return 'healthy';

    const criticalAlerts = this.getAlertsBySeverity('critical').length;
    const highAlerts = this.getAlertsBySeverity('high').length;
    const unhealthyQueues = queueMetrics.filter(
      metric => !metric.isHealthy,
    ).length;

    if (criticalAlerts > 0 || unhealthyQueues > queueMetrics.length * 0.5) {
      return 'critical';
    }

    if (highAlerts > 0 || unhealthyQueues > 0) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Generate recommendations based on current state
   */
  private generateRecommendations(
    queueMetrics: QueueHealthMetric[],
    recentAlerts: QueueAlert[],
  ): string[] {
    const recommendations: string[] = [];

    // High queue size recommendations
    const highQueueSizeAlerts = recentAlerts.filter(
      alert => alert.type === 'high_queue_size',
    );
    if (highQueueSizeAlerts.length > 0) {
      recommendations.push(
        'Consider increasing the number of workers or optimizing job processing',
      );
    }

    // High error rate recommendations
    const highErrorRateAlerts = recentAlerts.filter(
      alert => alert.type === 'high_error_rate',
    );
    if (highErrorRateAlerts.length > 0) {
      recommendations.push('Investigate and fix recurring job failures');
    }

    // Connection error recommendations
    const connectionErrors = recentAlerts.filter(
      alert => alert.type === 'connection_error',
    );
    if (connectionErrors.length > 0) {
      recommendations.push('Check Redis connection and configuration');
    }

    // Low throughput recommendations
    const lowThroughputAlerts = recentAlerts.filter(
      alert => alert.type === 'low_throughput',
    );
    if (lowThroughputAlerts.length > 0) {
      recommendations.push(
        'Consider scaling workers or optimizing job processing time',
      );
    }

    // General recommendations
    const avgWaitingJobs =
      queueMetrics.reduce((sum, metric) => sum + metric.stats.waiting, 0) /
      queueMetrics.length;
    if (avgWaitingJobs > 100) {
      recommendations.push(
        'Monitor queue capacity and consider horizontal scaling',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Queue system is operating normally');
    }

    return recommendations;
  }

  /**
   * Analyze a metric for potential alerts
   */
  private analyzeMetricForAlerts(metric: QueuePerformanceMetric): void {
    // Check for slow jobs
    if (metric.duration > 30000) {
      // 30 seconds
      this.addAlert({
        type: 'stalled_jobs',
        severity: metric.duration > 60000 ? 'high' : 'medium',
        message: `Slow job detected: ${metric.jobName} took ${(metric.duration / 1000).toFixed(1)}s`,
        timestamp: new Date(),
        queueName: metric.queueName,
        metadata: { jobName: metric.jobName, duration: metric.duration },
      });
    }

    // Check for high retry count
    if (metric.attempts > 3) {
      this.addAlert({
        type: 'high_error_rate',
        severity: 'medium',
        message: `Job with high retry count: ${metric.jobName} (${metric.attempts} attempts)`,
        timestamp: new Date(),
        queueName: metric.queueName,
        metadata: { jobName: metric.jobName, attempts: metric.attempts },
      });
    }
  }

  /**
   * Add an alert
   */
  private addAlert(alert: QueueAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlertsHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertsHistory);
    }

    // Log alert based on severity
    const logMessage = `[${alert.queueName}] ${alert.message}`;
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
   * Cleanup when service is destroyed
   */
  onModuleDestroy(): void {
    this.stopMonitoring();
  }

  /**
   * Get system-wide queue health
   */
  async getSystemHealth(): Promise<SystemQueueHealth> {
    const queueNames = this.queueService.getQueueNames();
    const queueHealthChecks: QueueHealthCheck[] = [];

    let healthyQueues = 0;
    let warningQueues = 0;
    let criticalQueues = 0;
    let totalJobs = 0;
    let totalActiveJobs = 0;
    let totalFailedJobs = 0;

    for (const queueName of queueNames) {
      try {
        const healthCheck = await this.performQueueHealthCheck(queueName);
        queueHealthChecks.push(healthCheck);

        switch (healthCheck.status) {
          case QueueHealthStatus.HEALTHY:
            healthyQueues++;
            break;
          case QueueHealthStatus.WARNING:
            warningQueues++;
            break;
          case QueueHealthStatus.CRITICAL:
            criticalQueues++;
            break;
        }

        const stats = await this.queueService.getQueueStats(queueName);
        totalJobs += stats.total;
        totalActiveJobs += stats.active;
        totalFailedJobs += stats.failed;
      } catch (error) {
        this.logger.error(
          `Failed to get health check for queue ${queueName}`,
          error,
        );
        criticalQueues++;
      }
    }

    const overallScore = this.calculateOverallHealthScore(queueHealthChecks);
    const overallStatus = this.determineOverallHealthStatus(overallScore);

    return {
      overallStatus,
      overallScore,
      queues: queueHealthChecks,
      systemMetrics: {
        totalQueues: queueNames.length,
        healthyQueues,
        warningQueues,
        criticalQueues,
        totalJobs,
        totalActiveJobs,
        totalFailedJobs,
        systemMemoryUsage: 0, // TODO: Implement actual memory monitoring
        redisConnectionStatus: QueueHealthStatus.HEALTHY, // TODO: Check Redis connection
      },
      systemRecommendations:
        this.generateSystemRecommendations(queueHealthChecks),
      timestamp: new Date(),
    };
  }

  /**
   * Get active alerts across all queues
   */
  getActiveAlerts(): QueueAlert[] {
    return this.getRecentAlerts();
  }

  /**
   * Get job metrics for a specific queue
   */
  getJobMetrics(queueName: string, limit = 50): JobMetrics[] {
    const queueMetrics = this.getQueuePerformanceMetrics(queueName, 24);

    return queueMetrics
      .map(metric => ({
        id: `${metric.queueName}-${metric.timestamp.getTime()}`,
        name: metric.jobName,
        status: metric.success ? ('completed' as const) : ('failed' as const),
        processingTime: metric.duration,
        attempts: metric.attempts,
        timestamp: metric.timestamp,
        error: metric.errorMessage,
      }))
      .slice(0, limit);
  }

  /**
   * Get queue performance metrics in the new interface format
   */
  async getQueuePerformanceMetricsDetailed(
    queueName: string,
  ): Promise<QueuePerformanceMetrics> {
    const metrics = this.getQueuePerformanceMetrics(queueName, 24);
    const stats = await this.queueService.getQueueStats(queueName);

    const totalProcessed = metrics.length;
    const totalFailed = metrics.filter(m => !m.success).length;
    const avgProcessingTime =
      totalProcessed > 0
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / totalProcessed
        : 0;

    const peakProcessingTime =
      totalProcessed > 0 ? Math.max(...metrics.map(m => m.duration)) : 0;

    const throughput = totalProcessed / 24; // jobs per hour
    const errorRate =
      totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      queueName,
      period: {
        start: oneDayAgo,
        end: now,
      },
      totalProcessed,
      totalFailed,
      avgProcessingTime,
      peakProcessingTime,
      throughput,
      errorRate,
      memoryStats: {
        min: 0, // TODO: Implement memory tracking
        max: 0,
        avg: 0,
      },
      statusDistribution: {
        completed: totalProcessed - totalFailed,
        failed: totalFailed,
        retried: metrics.filter(m => m.attempts > 1).length,
        stalled: 0, // TODO: Track stalled jobs
      },
    };
  }

  /**
   * Perform detailed health check for a queue
   */
  async performQueueHealthCheck(queueName: string): Promise<QueueHealthCheck> {
    const stats = await this.queueService.getQueueStats(queueName);
    const isHealthy = await this.queueService.isQueueHealthy(queueName);
    const performance = this.calculateQueuePerformance(queueName);

    // Calculate individual check statuses
    const connectionStatus = isHealthy
      ? QueueHealthStatus.HEALTHY
      : QueueHealthStatus.CRITICAL;

    const processingStatus = this.determineProcessingStatus(stats, performance);
    const memoryStatus = QueueHealthStatus.HEALTHY; // TODO: Implement memory checks
    const performanceStatus = this.determinePerformanceStatus(
      performance,
      stats,
    );

    const checks = {
      connection: {
        status: connectionStatus,
        latency: 0, // TODO: Measure Redis latency
        error: !isHealthy ? 'Queue connection unhealthy' : undefined,
      },
      processing: {
        status: processingStatus,
        activeJobs: stats.active,
        stalledJobs: 0, // TODO: Count stalled jobs
        errorRate: performance.errorRate,
      },
      memory: {
        status: memoryStatus,
        usage: 0, // TODO: Track memory usage
        threshold: 1000, // MB
      },
      performance: {
        status: performanceStatus,
        throughput: performance.throughput,
        averageProcessingTime: performance.avgProcessingTime,
        queueSize: stats.waiting,
      },
    };

    const score = this.calculateHealthScore(checks);
    const status = this.determineHealthStatus(score);
    const recommendations = this.generateQueueRecommendations(
      stats,
      performance,
      checks,
    );

    return {
      queueName,
      status,
      score,
      checks,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate overall health score from queue health checks
   */
  private calculateOverallHealthScore(
    healthChecks: QueueHealthCheck[],
  ): number {
    if (healthChecks.length === 0) return 100;

    const totalScore = healthChecks.reduce(
      (sum, check) => sum + check.score,
      0,
    );
    return Math.round(totalScore / healthChecks.length);
  }

  /**
   * Determine overall health status from score
   */
  private determineOverallHealthStatus(score: number): QueueHealthStatus {
    if (score >= 80) return QueueHealthStatus.HEALTHY;
    if (score >= 60) return QueueHealthStatus.WARNING;
    return QueueHealthStatus.CRITICAL;
  }

  /**
   * Generate system-wide recommendations
   */
  private generateSystemRecommendations(
    healthChecks: QueueHealthCheck[],
  ): string[] {
    const recommendations: string[] = [];

    const criticalQueues = healthChecks.filter(
      hc => hc.status === QueueHealthStatus.CRITICAL,
    );
    const warningQueues = healthChecks.filter(
      hc => hc.status === QueueHealthStatus.WARNING,
    );

    if (criticalQueues.length > 0) {
      recommendations.push(
        `${criticalQueues.length} queue(s) in critical state require immediate attention`,
      );
    }

    if (warningQueues.length > 0) {
      recommendations.push(
        `${warningQueues.length} queue(s) showing warning signs`,
      );
    }

    if (criticalQueues.length === 0 && warningQueues.length === 0) {
      recommendations.push('All queues are operating normally');
    }

    return recommendations;
  }

  /**
   * Determine processing status
   */
  private determineProcessingStatus(
    stats: QueueStats,
    performance: any,
  ): QueueHealthStatus {
    if (performance.errorRate > 25) return QueueHealthStatus.CRITICAL;
    if (performance.errorRate > 10) return QueueHealthStatus.WARNING;
    if (stats.waiting > 1000) return QueueHealthStatus.WARNING;
    return QueueHealthStatus.HEALTHY;
  }

  /**
   * Determine performance status
   */
  private determinePerformanceStatus(
    performance: any,
    stats: QueueStats,
  ): QueueHealthStatus {
    if (performance.throughput < 1 && stats.waiting > 100)
      return QueueHealthStatus.CRITICAL;
    if (performance.avgProcessingTime > 30000) return QueueHealthStatus.WARNING;
    return QueueHealthStatus.HEALTHY;
  }

  /**
   * Calculate health score from checks
   */
  private calculateHealthScore(checks: any): number {
    const scores = [
      this.getStatusScore(checks.connection.status),
      this.getStatusScore(checks.processing.status),
      this.getStatusScore(checks.memory.status),
      this.getStatusScore(checks.performance.status),
    ];

    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }

  /**
   * Get numeric score from status
   */
  private getStatusScore(status: QueueHealthStatus): number {
    switch (status) {
      case QueueHealthStatus.HEALTHY:
        return 100;
      case QueueHealthStatus.WARNING:
        return 70;
      case QueueHealthStatus.CRITICAL:
        return 30;
      case QueueHealthStatus.UNKNOWN:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Determine health status from score
   */
  private determineHealthStatus(score: number): QueueHealthStatus {
    if (score >= 80) return QueueHealthStatus.HEALTHY;
    if (score >= 60) return QueueHealthStatus.WARNING;
    return QueueHealthStatus.CRITICAL;
  }

  /**
   * Generate queue-specific recommendations
   */
  private generateQueueRecommendations(
    stats: QueueStats,
    performance: any,
    checks: any,
  ): string[] {
    const recommendations: string[] = [];

    if (checks.connection.status !== QueueHealthStatus.HEALTHY) {
      recommendations.push('Check Redis connection and configuration');
    }

    if (stats.waiting > 1000) {
      recommendations.push('High queue size - consider increasing workers');
    }

    if (performance.errorRate > 10) {
      recommendations.push('High error rate - investigate job failures');
    }

    if (performance.throughput < 1 && stats.waiting > 10) {
      recommendations.push('Low throughput - optimize job processing');
    }

    if (recommendations.length === 0) {
      recommendations.push('Queue is operating normally');
    }

    return recommendations;
  }
}
