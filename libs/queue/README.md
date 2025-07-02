# Queue Library

A robust, production-ready queue management library for NestJS applications, built on top of Bull queue. This library provides advanced features for job management, monitoring, health checks, and dashboard capabilities.

## Features

- 🚀 **Enhanced Queue Service**: Advanced job management with type safety
- 📊 **Queue Monitoring**: Real-time health checks and performance metrics
- 🎯 **Dashboard Service**: Comprehensive queue management dashboard
- 🔍 **Health Checks**: Automated queue health monitoring with alerts
- 📈 **Performance Metrics**: Detailed job and queue performance tracking
- 🛡️ **Error Handling**: Robust error handling and retry mechanisms
- 🔄 **Job Lifecycle Management**: Complete job lifecycle control
- 📦 **Bulk Operations**: Efficient bulk job processing
- 🎛️ **Queue Control**: Pause, resume, and clean queue operations

## Installation

The queue library is part of the NestJS monorepo. Import it in your application:

```typescript
import { QueueModule } from "@libs/queue";
```

## Basic Setup

### 1. Import QueueModule

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { QueueModule } from "@libs/queue";

@Module({
  imports: [QueueModule.register(["email", "notifications", "data-processing"])],
})
export class AppModule {}
```

### 2. Environment Configuration

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Usage Examples

### Basic Job Management

```typescript
import { Injectable } from "@nestjs/common";
import { EnhancedQueueService } from "@libs/queue";

@Injectable()
export class EmailService {
  constructor(private readonly queueService: EnhancedQueueService) {}

  async sendWelcomeEmail(userId: string, email: string) {
    // Add a simple job
    const job = await this.queueService.addJob("email", "send-welcome", {
      userId,
      email,
      template: "welcome",
    });

    console.log(`Welcome email job created: ${job.id}`);
    return job;
  }

  async sendBulkEmails(emails: Array<{ userId: string; email: string }>) {
    // Add multiple jobs at once
    const jobs = emails.map(emailData => ({
      name: "send-bulk-email",
      data: emailData,
      opts: {
        priority: 5, // Lower priority than welcome emails
        attempts: 3,
        backoff: {
          type: "exponential" as const,
          delay: 2000,
        },
      },
    }));

    const createdJobs = await this.queueService.addBulkJobs("email", jobs);
    console.log(`Created ${createdJobs.length} bulk email jobs`);
    return createdJobs;
  }
}
```

### Advanced Job Options

```typescript
import { Injectable } from "@nestjs/common";
import { EnhancedQueueService, EnhancedJobOptions } from "@libs/queue";

@Injectable()
export class DataProcessingService {
  constructor(private readonly queueService: EnhancedQueueService) {}

  async processLargeDataset(datasetId: string) {
    const jobOptions: EnhancedJobOptions = {
      priority: 10, // High priority
      timeout: 300000, // 5 minutes timeout
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: 10, // Keep only last 10 completed jobs
      removeOnFail: 5, // Keep only last 5 failed jobs
      tags: ["data-processing", "large-dataset"],
      metadata: {
        department: "analytics",
        estimatedDuration: "5-10 minutes",
      },
    };

    return await this.queueService.addJob(
      "data-processing",
      "process-dataset",
      { datasetId },
      jobOptions,
    );
  }

  async scheduleRecurringReport() {
    // Schedule a job to run every day at 9 AM
    return await this.queueService.addJob(
      "data-processing",
      "daily-report",
      { reportType: "analytics" },
      {
        repeat: {
          cron: "0 9 * * *", // Daily at 9 AM
        },
        removeOnComplete: 1,
        removeOnFail: 1,
      },
    );
  }
}
```

### Queue Monitoring

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { QueueMonitoringService } from "@libs/queue";

@Injectable()
export class QueueHealthService implements OnModuleInit {
  constructor(private readonly monitoringService: QueueMonitoringService) {}

  onModuleInit() {
    // Start monitoring all queues every 30 seconds
    this.monitoringService.startMonitoring(30000);
  }

  async getSystemHealth() {
    return await this.monitoringService.getSystemHealth();
  }

  async getQueueReport() {
    return await this.monitoringService.getMonitoringReport();
  }

  async getActiveAlerts() {
    return this.monitoringService.getActiveAlerts();
  }

  async clearAlertsForQueue(queueName: string) {
    this.monitoringService.clearAlerts(queueName);
  }
}
```

### Dashboard Integration

```typescript
import { Injectable } from "@nestjs/common";
import { QueueDashboardService } from "@libs/queue";

@Injectable()
export class QueueAdminService {
  constructor(private readonly dashboardService: QueueDashboardService) {}

  async getDashboard() {
    return await this.dashboardService.getDashboardData();
  }

  async getQueueStats() {
    return await this.dashboardService.getAllQueueStats();
  }

  async retryFailedJob(queueName: string, jobId: string) {
    const success = await this.dashboardService.retryJob(queueName, jobId);
    if (success) {
      console.log(`Successfully retried job ${jobId}`);
    } else {
      console.error(`Failed to retry job ${jobId}`);
    }
    return success;
  }

  async pauseQueue(queueName: string) {
    return await this.dashboardService.pauseQueue(queueName);
  }

  async resumeQueue(queueName: string) {
    return await this.dashboardService.resumeQueue(queueName);
  }

  async cleanCompletedJobs(queueName: string) {
    // Remove jobs completed more than 1 hour ago
    return await this.dashboardService.cleanQueue(
      queueName,
      3600000, // 1 hour in milliseconds
      "completed",
      100, // Limit to 100 jobs
    );
  }
}
```

### Job Processors

```typescript
import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";

@Processor("email")
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process("send-welcome")
  async handleWelcomeEmail(job: Job<{ userId: string; email: string; template: string }>) {
    const { userId, email, template } = job.data;

    this.logger.log(`Processing welcome email for user ${userId}`);

    try {
      // Simulate email sending
      await this.sendEmail(email, template);

      this.logger.log(`Welcome email sent successfully to ${email}`);
      return { success: true, sentTo: email };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      throw error; // This will mark the job as failed
    }
  }

  @Process("send-bulk-email")
  async handleBulkEmail(job: Job<{ userId: string; email: string }>) {
    const { userId, email } = job.data;

    // Update job progress
    await job.progress(50);

    try {
      await this.sendEmail(email, "bulk");
      await job.progress(100);

      return { success: true, sentTo: email };
    } catch (error) {
      throw error;
    }
  }

  private async sendEmail(email: string, template: string): Promise<void> {
    // Email sending logic here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  }
}
```

### Error Handling and Retries

```typescript
import { Injectable } from "@nestjs/common";
import { EnhancedQueueService } from "@libs/queue";

@Injectable()
export class RobustJobService {
  constructor(private readonly queueService: EnhancedQueueService) {}

  async processWithRetry(data: any) {
    return await this.queueService.addJob("processing", "critical-task", data, {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      // Custom retry logic
      removeOnFail: false, // Keep failed jobs for analysis
    });
  }

  async retryFailedJobs(queueName: string) {
    const stats = await this.queueService.getQueueStats(queueName);
    console.log(`Found ${stats.failed} failed jobs to retry`);

    // Get failed jobs and retry them
    const failedJobs = await this.queueService.getJobs(queueName, ["failed"]);

    for (const job of failedJobs) {
      try {
        await this.queueService.retryJob(queueName, job.id.toString());
        console.log(`Retried job ${job.id}`);
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error);
      }
    }
  }
}
```

## Configuration

### Queue Configuration

```typescript
// queue.config.ts
export const queueConfig = {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
  settings: {
    stalledInterval: 30 * 1000, // 30 seconds
    maxStalledCount: 1,
  },
};
```

### Health Check Configuration

```typescript
// monitoring.config.ts
export const monitoringConfig = {
  interval: 30000, // 30 seconds
  thresholds: {
    queueSizeWarning: 100,
    queueSizeCritical: 500,
    errorRateWarning: 5, // 5%
    errorRateCritical: 15, // 15%
    processingTimeWarning: 30000, // 30 seconds
    processingTimeCritical: 60000, // 1 minute
  },
};
```

## Best Practices

### 1. Job Design

- Keep job data small and serializable
- Use job IDs for tracking and debugging
- Implement proper error handling in processors
- Use appropriate job priorities

### 2. Monitoring

- Set up health check monitoring
- Monitor queue sizes and processing times
- Set up alerts for critical issues
- Regular cleanup of completed/failed jobs

### 3. Performance

- Use bulk operations for multiple jobs
- Configure appropriate concurrency settings
- Monitor memory usage
- Implement job timeouts

### 4. Error Handling

- Configure retry strategies based on job types
- Log job failures with context
- Implement dead letter queues for persistent failures
- Monitor error rates and patterns

## API Reference

### EnhancedQueueService

- `addJob(queueName, jobName, data, options?)`: Add a single job
- `addBulkJobs(queueName, jobs)`: Add multiple jobs efficiently
- `getJob(queueName, jobId)`: Get job details
- `removeJob(queueName, jobId)`: Remove a job
- `retryJob(queueName, jobId)`: Retry a failed job
- `getJobs(queueName, types, start?, end?)`: Get jobs by status
- `getQueueStats(queueName)`: Get queue statistics
- `pauseQueue(queueName)`: Pause job processing
- `resumeQueue(queueName)`: Resume job processing
- `cleanQueue(queueName, grace, status, limit?)`: Clean old jobs

### QueueMonitoringService

- `startMonitoring(interval?)`: Start automated monitoring
- `stopMonitoring()`: Stop monitoring
- `getSystemHealth()`: Get system-wide health status
- `getMonitoringReport()`: Get comprehensive monitoring report
- `getActiveAlerts()`: Get current alerts
- `recordJobMetric(metric)`: Record job performance metric

### QueueDashboardService

- `getDashboardData()`: Get comprehensive dashboard data
- `getAllQueueStats()`: Get statistics for all queues
- `getRecentActivity(limit?)`: Get recent job activity
- `getJobDetails(queueName, jobId)`: Get detailed job information
- `getQueueHealthSummary()`: Get queue health summary
- `getRealTimeMetrics()`: Get real-time system metrics

## Troubleshooting

### Common Issues

1. **High Queue Size**: Increase worker concurrency or optimize job processing
2. **High Error Rate**: Check job logic and data validation
3. **Memory Issues**: Implement job cleanup and monitor memory usage
4. **Connection Issues**: Verify Redis connection and configuration

### Debugging

```typescript
// Enable debug logging
const job = await queueService.addJob("debug", "test-job", data, {
  metadata: { debug: true, timestamp: new Date().toISOString() },
});

// Get job logs
const jobDetails = await queueService.getJob("debug", job.id);
console.log("Job logs:", jobDetails?.logs);
```

## Migration Guide

If you're upgrading from the basic queue implementation:

1. Replace `QueueModule.forRoot()` with `QueueModule.register(queueNames)`
2. Update service imports to use `EnhancedQueueService`
3. Implement monitoring by injecting `QueueMonitoringService`
4. Update job processors to handle new job options
5. Add error handling and retry logic to your jobs

## Contributing

When contributing to the queue library:

1. Add tests for new features
2. Update documentation
3. Follow TypeScript best practices
4. Ensure backward compatibility
5. Test with different Redis configurations
