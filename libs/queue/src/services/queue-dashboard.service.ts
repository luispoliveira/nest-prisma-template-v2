import { Injectable, Logger } from '@nestjs/common';
import { JobMetrics, JobStatus } from '../interfaces/job.interface';
import {
  QueueHealthStatus,
  SystemQueueHealth,
} from '../interfaces/queue-health.interface';
import {
  ExtendedQueueStats,
  QueuePerformanceMetrics,
} from '../interfaces/queue-stats.interface';
import { EnhancedQueueService } from './enhanced-queue.service';
import { QueueMonitoringService } from './queue-monitoring.service';

/**
 * Dashboard data aggregation interface
 */
export interface DashboardData {
  /** System overview */
  overview: {
    totalQueues: number;
    totalJobs: number;
    totalActiveJobs: number;
    totalCompletedJobs: number;
    totalFailedJobs: number;
    overallHealthScore: number;
    systemStatus: QueueHealthStatus;
  };

  /** Queue statistics */
  queueStats: ExtendedQueueStats[];

  /** Recent job activity */
  recentActivity: JobMetrics[];

  /** System health */
  health: SystemQueueHealth;

  /** Performance trends */
  performanceTrends: QueuePerformanceMetrics[];

  /** Active alerts */
  alerts: any[];

  /** Top performing queues */
  topPerformers: {
    queueName: string;
    throughput: number;
    healthScore: number;
  }[];

  /** Problematic queues */
  problematicQueues: {
    queueName: string;
    issues: string[];
    severity: QueueHealthStatus;
  }[];
}

/**
 * Queue dashboard service for monitoring and management
 */
@Injectable()
export class QueueDashboardService {
  private readonly logger = new Logger(QueueDashboardService.name);

  constructor(
    private readonly queueService: EnhancedQueueService,
    private readonly monitoringService: QueueMonitoringService,
  ) {}

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      const [
        systemHealth,
        queueStats,
        recentActivity,
        alerts,
        performanceTrends,
      ] = await Promise.all([
        this.monitoringService.getSystemHealth(),
        this.getAllQueueStats(),
        this.getRecentActivity(),
        this.monitoringService.getActiveAlerts(),
        this.getPerformanceTrends(),
      ]);

      const overview = this.calculateOverview(systemHealth, queueStats);
      const topPerformers = this.getTopPerformers(queueStats);
      const problematicQueues = this.getProblematicQueues(systemHealth);

      return {
        overview,
        queueStats,
        recentActivity,
        health: systemHealth,
        performanceTrends,
        alerts,
        topPerformers,
        problematicQueues,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard data', error);
      throw error;
    }
  }

  /**
   * Get statistics for all queues
   */
  async getAllQueueStats(): Promise<ExtendedQueueStats[]> {
    const queueNames = this.queueService.getQueueNames();
    const statsPromises = queueNames.map(async queueName => {
      const stats = await this.queueService.getQueueStats(queueName);
      const performance =
        await this.monitoringService.getQueuePerformanceMetricsDetailed(
          queueName,
        );

      return {
        ...stats,
        name: queueName,
        lastUpdated: new Date(),
        errorRate: performance.errorRate,
        throughput: performance.throughput,
        peakProcessingTime: performance.peakProcessingTime,
        minProcessingTime: 0, // TODO: Add to performance metrics
        processingTimeStdDev: 0, // TODO: Add to performance metrics
        stalled: 0, // TODO: Add stalled job count
        healthScore: await this.calculateQueueHealthScore(queueName),
      };
    });

    return Promise.all(statsPromises);
  }

  /**
   * Get recent job activity across all queues
   */
  async getRecentActivity(limit = 50): Promise<JobMetrics[]> {
    const queueNames = this.queueService.getQueueNames();
    const activityPromises = queueNames.map(async queueName => {
      return this.monitoringService.getJobMetrics(queueName, limit);
    });

    const allActivity = await Promise.all(activityPromises);
    return allActivity
      .flat()
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get performance trends for queues
   */
  async getPerformanceTrends(): Promise<QueuePerformanceMetrics[]> {
    const queueNames = this.queueService.getQueueNames();
    const trendsPromises = queueNames.map(async queueName => {
      return this.monitoringService.getQueuePerformanceMetricsDetailed(
        queueName,
      );
    });

    return Promise.all(trendsPromises);
  }

  /**
   * Get job details by ID
   */
  async getJobDetails(
    queueName: string,
    jobId: string | number,
  ): Promise<JobStatus | null> {
    try {
      const job = await this.queueService.getJob(queueName, String(jobId));
      if (!job) return null;

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress: await job.progress(),
        delay: job.opts.delay || 0,
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get job details for ${jobId} in queue ${queueName}`,
        error,
      );
      return null;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string | number): Promise<boolean> {
    try {
      await this.queueService.retryJob(queueName, String(jobId));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to retry job ${jobId} in queue ${queueName}`,
        error,
      );
      return false;
    }
  }

  /**
   * Remove a job from queue
   */
  async removeJob(queueName: string, jobId: string | number): Promise<boolean> {
    try {
      await this.queueService.removeJob(queueName, String(jobId));
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to remove job ${jobId} from queue ${queueName}`,
        error,
      );
      return false;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<boolean> {
    try {
      await this.queueService.pauseQueue(queueName);
      return true;
    } catch (error) {
      this.logger.error(`Failed to pause queue ${queueName}`, error);
      return false;
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<boolean> {
    try {
      await this.queueService.resumeQueue(queueName);
      return true;
    } catch (error) {
      this.logger.error(`Failed to resume queue ${queueName}`, error);
      return false;
    }
  }

  /**
   * Clean a queue
   */
  async cleanQueue(
    queueName: string,
    grace: number,
    status: 'completed' | 'active' | 'failed',
    limit?: number,
  ): Promise<boolean> {
    try {
      await this.queueService.cleanQueue(queueName, grace, status, limit);
      return true;
    } catch (error) {
      this.logger.error(`Failed to clean queue ${queueName}`, error);
      return false;
    }
  }

  /**
   * Get queue health summary
   */
  async getQueueHealthSummary(): Promise<{
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  }> {
    const systemHealth = await this.monitoringService.getSystemHealth();

    return {
      healthy: systemHealth.systemMetrics.healthyQueues,
      warning: systemHealth.systemMetrics.warningQueues,
      critical: systemHealth.systemMetrics.criticalQueues,
      total: systemHealth.systemMetrics.totalQueues,
    };
  }

  /**
   * Get real-time queue metrics
   */
  async getRealTimeMetrics(): Promise<{
    timestamp: Date;
    totalJobs: number;
    activeJobs: number;
    completedJobsLastHour: number;
    failedJobsLastHour: number;
    averageProcessingTime: number;
    memoryUsage: number;
  }> {
    const queueStats = await this.getAllQueueStats();
    const currentTime = new Date();
    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);

    const totalJobs = queueStats.reduce((sum, stats) => sum + stats.total, 0);
    const activeJobs = queueStats.reduce((sum, stats) => sum + stats.active, 0);
    const averageProcessingTime =
      queueStats.reduce(
        (sum, stats) => sum + (stats.averageProcessingTime || 0),
        0,
      ) / queueStats.length;

    return {
      timestamp: currentTime,
      totalJobs,
      activeJobs,
      completedJobsLastHour: 0, // TODO: Implement time-based filtering
      failedJobsLastHour: 0, // TODO: Implement time-based filtering
      averageProcessingTime,
      memoryUsage: 0, // TODO: Get actual memory usage
    };
  }

  /**
   * Calculate overview statistics
   */
  private calculateOverview(
    systemHealth: SystemQueueHealth,
    queueStats: ExtendedQueueStats[],
  ) {
    const totalJobs = queueStats.reduce((sum, stats) => sum + stats.total, 0);
    const totalActiveJobs = queueStats.reduce(
      (sum, stats) => sum + stats.active,
      0,
    );
    const totalCompletedJobs = queueStats.reduce(
      (sum, stats) => sum + stats.completed,
      0,
    );
    const totalFailedJobs = queueStats.reduce(
      (sum, stats) => sum + stats.failed,
      0,
    );

    return {
      totalQueues: systemHealth.systemMetrics.totalQueues,
      totalJobs,
      totalActiveJobs,
      totalCompletedJobs,
      totalFailedJobs,
      overallHealthScore: systemHealth.overallScore,
      systemStatus: systemHealth.overallStatus,
    };
  }

  /**
   * Get top performing queues
   */
  private getTopPerformers(queueStats: ExtendedQueueStats[]) {
    return queueStats
      .map(stats => ({
        queueName: stats.name,
        throughput: stats.throughput,
        healthScore: stats.healthScore,
      }))
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 5);
  }

  /**
   * Get problematic queues
   */
  private getProblematicQueues(systemHealth: SystemQueueHealth) {
    return systemHealth.queues
      .filter(queue => queue.status !== QueueHealthStatus.HEALTHY)
      .map(queue => ({
        queueName: queue.queueName,
        issues: queue.recommendations,
        severity: queue.status,
      }))
      .sort((a, b) => {
        const severityOrder = {
          [QueueHealthStatus.CRITICAL]: 3,
          [QueueHealthStatus.WARNING]: 2,
          [QueueHealthStatus.HEALTHY]: 1,
          [QueueHealthStatus.UNKNOWN]: 0,
        };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Calculate queue health score
   */
  private async calculateQueueHealthScore(queueName: string): Promise<number> {
    try {
      const healthCheck =
        await this.monitoringService.performQueueHealthCheck(queueName);
      return healthCheck.score;
    } catch (error) {
      this.logger.error(
        `Failed to calculate health score for queue ${queueName}`,
        error,
      );
      return 0;
    }
  }
}
