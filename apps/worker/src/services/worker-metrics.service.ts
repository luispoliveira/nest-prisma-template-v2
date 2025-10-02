import { Injectable, Logger } from '@nestjs/common';

interface JobMetric {
  jobName: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  attempts: number;
  errorMessage?: string;
}

@Injectable()
export class WorkerMetricsService {
  private readonly logger = new Logger(WorkerMetricsService.name);
  private metrics: JobMetric[] = [];

  recordJobMetric(metric: JobMetric): void {
    this.metrics.push(metric);
    if (!metric.success) {
      this.logger.warn(
        `Job failed: ${metric.jobName} (Attempts: ${metric.attempts}) - ${metric.errorMessage}`,
      );
    } else {
      this.logger.debug(
        `Job succeeded: ${metric.jobName} (Duration: ${metric.duration}ms)`,
      );
    }
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getRecentMetrics(limit = 50): JobMetric[] {
    return this.metrics.slice(-limit);
  }

  getErrorRate(): number {
    const total = this.metrics.length;
    if (total === 0) return 0;
    const failed = this.metrics.filter(m => !m.success).length;
    return (failed / total) * 100;
  }
}
