import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkerConfig } from '../config/configuration';

interface WorkerHealthMetrics {
  status: 'healthy' | 'unhealthy' | 'degraded';
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  lastHealthCheck: Date;
  errors: Array<{
    message: string;
    timestamp: Date;
    stack?: string;
  }>;
}

@Injectable()
export class WorkerHealthService implements OnModuleInit {
  private readonly logger = new Logger(WorkerHealthService.name);
  private readonly config: WorkerConfig;
  private startTime: Date;
  private healthMetrics: WorkerHealthMetrics;
  private errors: Array<{ message: string; timestamp: Date; stack?: string }> =
    [];

  constructor(private _configService: ConfigService) {
    const config = this._configService.get<WorkerConfig>('worker');
    if (!config) {
      throw new Error('Worker configuration is not defined');
    }
    this.config = config;
    this.startTime = new Date();
    this.initializeHealthMetrics();
  }

  private initializeHealthMetrics(): void {
    this.healthMetrics = {
      status: 'healthy',
      uptime: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      },
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      lastHealthCheck: new Date(),
      errors: [],
    };
  }

  onModuleInit() {
    if (this.config.healthCheck.enabled) {
      setInterval(() => {
        this.performHealthCheck();
      }, this.config.healthCheck.interval);
    }
  }

  async performHealthCheck(): Promise<void> {
    try {
      await this.updateHealthMetrics();
      this.evaluateHealth();
      this.logger.debug(`Health check completed: ${this.healthMetrics.status}`);
    } catch (error: any) {
      this.logger.error('Health check failed', error);
      this.recordError(error);
    }
  }

  private async updateHealthMetrics(): Promise<void> {
    const memoryUsage = process.memoryUsage();

    this.healthMetrics = {
      ...this.healthMetrics,
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      lastHealthCheck: new Date(),
      errors: this.errors.slice(-10), // Keep last 10 errors
    };
  }

  private evaluateHealth(): void {
    const { memoryUsage, errors } = this.healthMetrics;

    // Check memory usage (considering 512MB as warning threshold)
    const memoryWarningThreshold = 512;
    const memoryCriticalThreshold = 1024;

    // Check recent errors (in last 5 minutes)
    const recentErrors = errors.filter(
      error => Date.now() - error.timestamp.getTime() < 5 * 60 * 1000,
    );

    if (memoryUsage.rss > memoryCriticalThreshold || recentErrors.length > 10) {
      this.healthMetrics.status = 'unhealthy';
    } else if (
      memoryUsage.rss > memoryWarningThreshold ||
      recentErrors.length > 5
    ) {
      this.healthMetrics.status = 'degraded';
    } else {
      this.healthMetrics.status = 'healthy';
    }
  }

  recordError(error: Error): void {
    this.errors.push({
      message: error.message,
      timestamp: new Date(),
      stack: error.stack,
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  incrementProcessingJobs(): void {
    this.healthMetrics.processingJobs++;
  }

  decrementProcessingJobs(): void {
    this.healthMetrics.processingJobs = Math.max(
      0,
      this.healthMetrics.processingJobs - 1,
    );
  }

  incrementCompletedJobs(): void {
    this.healthMetrics.completedJobs++;
  }

  incrementFailedJobs(): void {
    this.healthMetrics.failedJobs++;
  }

  getHealthStatus(): WorkerHealthMetrics {
    return { ...this.healthMetrics };
  }

  isHealthy(): boolean {
    return this.healthMetrics.status === 'healthy';
  }
}
