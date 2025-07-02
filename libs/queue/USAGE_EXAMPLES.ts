/**
 * Queue Library Usage Examples
 *
 * This file contains practical examples of how to use the enhanced queue library
 * in various scenarios and use cases.
 */

// This file contains examples and is not meant to be executed directly
// Copy the relevant examples to your application services

/*
// =============================================================================
// BASIC USAGE EXAMPLES
// =============================================================================

// Example 1: Simple Email Service
import { Injectable, Logger } from '@nestjs/common';
import { EnhancedQueueService, QueueJobData } from '@libs/queue';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly queueService: EnhancedQueueService) {}

  async sendWelcomeEmail(userId: string, email: string) {
    const jobData: QueueJobData = {
      payload: {
        userId,
        email,
        template: 'welcome',
      },
      metadata: {
        userId,
        source: 'user-registration',
        priority: 5,
      },
    };

    const job = await this.queueService.addJob('email', 'send-welcome', jobData);
    this.logger.log(`Welcome email job created: ${job.id}`);
    return job;
  }

  async sendPasswordResetEmail(userId: string, email: string, resetToken: string) {
    const jobData: QueueJobData = {
      payload: {
        userId,
        email,
        resetToken,
      },
      metadata: {
        userId,
        source: 'password-reset',
        priority: 10, // High priority for security
      },
    };

    const jobOptions = {
      priority: 10,
      attempts: 5,
      timeout: 30000,
      backoff: { type: 'exponential', delay: 2000 },
    };

    return await this.queueService.addJob(
      'email',
      'send-password-reset',
      jobData,
      jobOptions
    );
  }
}

// =============================================================================
// ADVANCED USAGE EXAMPLES
// =============================================================================

// Example 2: Data Processing Service
import { Injectable, Logger } from '@nestjs/common';
import { EnhancedQueueService, QueueJobData } from '@libs/queue';

@Injectable()
export class DataProcessingService {
  private readonly logger = new Logger(DataProcessingService.name);

  constructor(private readonly queueService: EnhancedQueueService) {}

  async processLargeDataset(datasetId: string, processingOptions: any) {
    const jobData: QueueJobData = {
      payload: {
        datasetId,
        options: processingOptions,
      },
      metadata: {
        source: 'data-processing',
        priority: 8,
        maxRetries: 3,
      },
    };

    const jobOptions = {
      priority: 8,
      timeout: 600000, // 10 minutes
      attempts: 3,
      backoff: { type: 'exponential', delay: 10000 },
      removeOnComplete: 10,
      removeOnFail: false, // Keep failed jobs for analysis
    };

    return await this.queueService.addJob(
      'data-processing',
      'process-large-dataset',
      jobData,
      jobOptions
    );
  }

  async scheduleRecurringReports() {
    const jobs = [
      {
        name: 'daily-analytics-report',
        data: {
          payload: { reportType: 'analytics', frequency: 'daily' },
          metadata: { source: 'scheduled-reports', priority: 5 },
        },
        options: {
          repeat: { cron: '0 9 * * *' }, // Every day at 9 AM
          removeOnComplete: 1,
          removeOnFail: 1,
        },
      },
      {
        name: 'weekly-summary-report',
        data: {
          payload: { reportType: 'summary', frequency: 'weekly' },
          metadata: { source: 'scheduled-reports', priority: 5 },
        },
        options: {
          repeat: { cron: '0 10 * * 1' }, // Every Monday at 10 AM
          removeOnComplete: 1,
          removeOnFail: 1,
        },
      },
    ];

    return await this.queueService.addBulkJobs('data-processing', jobs);
  }
}

// =============================================================================
// MONITORING EXAMPLES
// =============================================================================

// Example 3: Queue Health Monitoring
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueMonitoringService, QueueDashboardService } from '@libs/queue';

@Injectable()
export class QueueHealthService implements OnModuleInit {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    private readonly monitoringService: QueueMonitoringService,
    private readonly dashboardService: QueueDashboardService,
  ) {}

  onModuleInit() {
    // Start monitoring every 30 seconds
    this.monitoringService.startMonitoring(30000);
    this.logger.log('Queue monitoring started');
  }

  async getSystemHealth() {
    const health = await this.monitoringService.getSystemHealth();
    
    this.logger.log(`System Health: ${health.overallStatus} (Score: ${health.overallScore})`);
    this.logger.log(`Queues: ${health.systemMetrics.totalQueues} total, ${health.systemMetrics.healthyQueues} healthy`);
    
    if (health.systemRecommendations.length > 0) {
      this.logger.warn('System Recommendations:');
      health.systemRecommendations.forEach(rec => this.logger.warn(`- ${rec}`));
    }

    return health;
  }

  async handleAlerts() {
    const alerts = this.monitoringService.getActiveAlerts();
    
    if (alerts.length === 0) {
      this.logger.log('No active alerts');
      return;
    }

    this.logger.warn(`Found ${alerts.length} active alerts`);
    
    alerts.forEach(alert => {
      const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
      this.logger[logLevel](`[${alert.queueName}] ${alert.type}: ${alert.message}`);
    });
  }
}

// =============================================================================
// DASHBOARD EXAMPLES
// =============================================================================

// Example 4: Queue Management Dashboard
import { Injectable, Logger } from '@nestjs/common';
import { QueueDashboardService } from '@libs/queue';

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);

  constructor(private readonly dashboardService: QueueDashboardService) {}

  async getDashboard() {
    const dashboard = await this.dashboardService.getDashboardData();
    
    this.logger.log('=== Queue Dashboard ===');
    this.logger.log(`System Status: ${dashboard.overview.systemStatus}`);
    this.logger.log(`Total Jobs: ${dashboard.overview.totalJobs}`);
    this.logger.log(`Active Jobs: ${dashboard.overview.totalActiveJobs}`);
    this.logger.log(`Health Score: ${dashboard.overview.overallHealthScore}`);
    
    if (dashboard.alerts.length > 0) {
      this.logger.warn(`Active Alerts: ${dashboard.alerts.length}`);
    }

    return dashboard;
  }

  async retryFailedJobs(queueName: string) {
    const stats = await this.dashboardService.getAllQueueStats();
    const queueStats = stats.find(s => s.name === queueName);
    
    if (!queueStats || queueStats.failed === 0) {
      this.logger.log(`No failed jobs in queue ${queueName}`);
      return;
    }

    this.logger.log(`Found ${queueStats.failed} failed jobs in ${queueName}`);
    
    // In a real implementation, you would get actual job IDs
    // and retry them individually
    this.logger.log('Retry logic would be implemented here');
  }

  async cleanupOldJobs(queueName: string) {
    const success = await this.dashboardService.cleanQueue(
      queueName,
      24 * 60 * 60 * 1000, // 24 hours
      'completed',
      100 // Limit
    );

    if (success) {
      this.logger.log(`Cleaned old jobs from ${queueName}`);
    } else {
      this.logger.error(`Failed to clean ${queueName}`);
    }

    return success;
  }
}

// =============================================================================
// INTEGRATION EXAMPLE
// =============================================================================

// Example 5: Full Application Integration
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { 
  EnhancedQueueService, 
  QueueMonitoringService, 
  QueueDashboardService 
} from '@libs/queue';

@Injectable()
export class AppQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppQueueService.name);
  private maintenanceInterval?: NodeJS.Timeout;

  constructor(
    private readonly queueService: EnhancedQueueService,
    private readonly monitoringService: QueueMonitoringService,
    private readonly dashboardService: QueueDashboardService,
  ) {}

  onModuleInit() {
    this.initializeQueues();
  }

  onModuleDestroy() {
    this.monitoringService.stopMonitoring();
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
    }
  }

  private async initializeQueues() {
    this.logger.log('Initializing queue system...');

    // Start monitoring
    this.monitoringService.startMonitoring(30000);

    // Schedule maintenance every hour
    this.maintenanceInterval = setInterval(
      () => this.performMaintenance(),
      60 * 60 * 1000
    );

    // Initial health check
    const health = await this.monitoringService.getSystemHealth();
    this.logger.log(`Queue system ready - Health: ${health.overallStatus}`);
  }

  private async performMaintenance() {
    this.logger.log('Running queue maintenance...');

    try {
      const queueNames = this.queueService.getQueueNames();
      
      for (const queueName of queueNames) {
        // Clean completed jobs older than 24 hours
        await this.dashboardService.cleanQueue(
          queueName,
          24 * 60 * 60 * 1000,
          'completed',
          50
        );
      }

      this.logger.log('Queue maintenance completed');
    } catch (error) {
      this.logger.error('Queue maintenance failed:', error);
    }
  }

  async getSystemSummary() {
    const [health, dashboard] = await Promise.all([
      this.monitoringService.getSystemHealth(),
      this.dashboardService.getDashboardData(),
    ]);

    return {
      status: health.overallStatus,
      score: health.overallScore,
      totalJobs: dashboard.overview.totalJobs,
      activeJobs: dashboard.overview.totalActiveJobs,
      alerts: dashboard.alerts.length,
      recommendations: health.systemRecommendations,
    };
  }
}

// =============================================================================
// PROCESSOR EXAMPLES
// =============================================================================

// Example 6: Job Processors
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome')
  async handleWelcomeEmail(job: Job) {
    const { payload, metadata } = job.data;
    const { userId, email, template } = payload;
    
    this.logger.log(`Processing welcome email for user ${userId}`);
    
    try {
      // Update progress
      await job.progress(25);
      
      // Simulate email sending
      await this.sendEmail(email, template);
      await job.progress(75);
      
      // Log success
      this.logger.log(`Welcome email sent to ${email}`);
      await job.progress(100);
      
      return { success: true, sentTo: email };
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
      throw error;
    }
  }

  @Process('send-password-reset')
  async handlePasswordResetEmail(job: Job) {
    const { payload } = job.data;
    const { userId, email, resetToken } = payload;
    
    this.logger.log(`Processing password reset email for user ${userId}`);
    
    try {
      await this.sendPasswordResetEmail(email, resetToken);
      return { success: true, sentTo: email };
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      throw error;
    }
  }

  private async sendEmail(email: string, template: string): Promise<void> {
    // Email sending implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Password reset email implementation
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

@Processor('data-processing')
export class DataProcessor {
  private readonly logger = new Logger(DataProcessor.name);

  @Process('process-large-dataset')
  async handleDatasetProcessing(job: Job) {
    const { payload } = job.data;
    const { datasetId, options } = payload;
    
    this.logger.log(`Processing dataset ${datasetId}`);
    
    try {
      await job.progress(10);
      
      // Simulate data processing
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await job.progress(10 + (i * 9));
      }
      
      this.logger.log(`Dataset ${datasetId} processed successfully`);
      return { success: true, datasetId, recordsProcessed: 1000 };
    } catch (error) {
      this.logger.error(`Failed to process dataset ${datasetId}: ${error.message}`);
      throw error;
    }
  }

  @Process('daily-analytics-report')
  async handleDailyReport(job: Job) {
    const { payload } = job.data;
    
    this.logger.log('Generating daily analytics report');
    
    try {
      // Generate report logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, reportGenerated: true };
    } catch (error) {
      this.logger.error(`Failed to generate daily report: ${error.message}`);
      throw error;
    }
  }
}

*/

// End of examples
