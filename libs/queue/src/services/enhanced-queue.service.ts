import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, JobStatus, Queue } from 'bull';

export interface QueueJobData {
  id?: string;
  payload: any;
  metadata?: {
    userId?: string;
    requestId?: string;
    source?: string;
    priority?: number;
    maxRetries?: number;
    delayMs?: number;
    [key: string]: any;
  };
}

export interface QueueJobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  backoff?: number | { type: string; delay?: number; settings?: any };
  jobId?: string;
  repeat?: {
    cron?: string;
    tz?: string;
    every?: number;
    limit?: number;
    endDate?: Date | string | number;
  };
  lifo?: boolean;
  timeout?: number;
  preventParsingData?: boolean;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

export interface JobInfo {
  id: string;
  name: string;
  data: any;
  status: JobStatus;
  progress: number;
  attemptsMade: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
  failedReason?: string;
  returnvalue?: any;
  logs?: string[];
}

@Injectable()
export class EnhancedQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(EnhancedQueueService.name);
  private queues = new Map<string, Queue>();

  defaultOptions: QueueJobOptions = {
    removeOnComplete: true,
  };
  /**
   * Register a queue instance
   */
  registerQueue(name: string, queue: Queue): void {
    if (this.queues.has(name)) {
      this.logger.warn(`Queue '${name}' is already registered. Skipping.`);
      return;
    }
    this.queues.set(name, queue);
    this.setupQueueListeners(name, queue);
    this.logger.log(`Queue '${name}' registered`);
  }

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: QueueJobData,
    options: QueueJobOptions = this.defaultOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const jobOptions: any = {
      priority: data.metadata?.priority || options.priority || 0,
      delay: data.metadata?.delayMs || options.delay,
      attempts: data.metadata?.maxRetries || options.attempts || 3,
      removeOnComplete: options.removeOnComplete ?? 10,
      removeOnFail: options.removeOnFail ?? 50,
      backoff: options.backoff || {
        type: 'exponential',
        delay: 2000,
      },
      jobId: data.id || options.jobId,
      ...options,
    };

    // Handle repeat option separately to avoid type conflicts
    if (options.repeat) {
      jobOptions.repeat = options.repeat;
    }

    try {
      const job = await queue.add(jobName, data, jobOptions);

      this.logger.debug(
        `Job '${jobName}' added to queue '${queueName}' with ID: ${job.id}`,
      );

      return job;
    } catch (error) {
      this.logger.error(
        `Failed to add job '${jobName}' to queue '${queueName}'`,
        error,
      );
      throw error;
    }
  }

  /**
   * Add multiple jobs to a queue
   */
  async addBulkJobs<T = any>(
    queueName: string,
    jobs: Array<{
      name: string;
      data: QueueJobData;
      options?: QueueJobOptions;
    }>,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const bulkJobs = jobs.map(({ name, data, options }) => {
      const jobOptions = { ...this.defaultOptions, ...options };
      return {
        name,
        data,
        opts: {
          priority: data.metadata?.priority || jobOptions.priority || 0,
          delay: data.metadata?.delayMs || jobOptions.delay,
          attempts: data.metadata?.maxRetries || jobOptions.attempts || 3,
          removeOnComplete: jobOptions.removeOnComplete ?? 10,
          removeOnFail: jobOptions.removeOnFail ?? 50,
          backoff: jobOptions.backoff || {
            type: 'exponential',
            delay: 2000,
          },
          jobId: data.id || jobOptions.jobId,
          ...jobOptions,
        },
      };
    });

    try {
      const createdJobs = await queue.addBulk(bulkJobs);

      this.logger.debug(`${jobs.length} jobs added to queue '${queueName}'`);

      return createdJobs;
    } catch (error) {
      this.logger.error(
        `Failed to add bulk jobs to queue '${queueName}'`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    return await queue.getJob(jobId);
  }

  /**
   * Get job information
   */
  async getJobInfo(queueName: string, jobId: string): Promise<JobInfo | null> {
    const job = await this.getJob(queueName, jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();

    let logs: string[] = [];
    try {
      // Try to get job logs if available
      const queue = this.getQueue(queueName);
      if (queue && (queue as any).getJobLogs) {
        const jobLogs = await (queue as any).getJobLogs(jobId);
        logs = jobLogs.logs || [];
      }
    } catch (error) {
      // Logs might not be available
      logs = [];
    }

    return {
      id: job.id.toString(),
      name: job.name,
      data: job.data,
      status: state as JobStatus,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts || 0,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      logs: logs,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<QueueStats> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.isPaused(),
      ]);

    const total =
      waiting.length +
      active.length +
      completed.length +
      failed.length +
      delayed.length;

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: paused ? 1 : 0,
      total,
    };
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    queueName: string,
    status: JobStatus,
    start = 0,
    end = -1,
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    switch (status) {
      case 'waiting':
        return await queue.getWaiting(start, end);
      case 'active':
        return await queue.getActive(start, end);
      case 'completed':
        return await queue.getCompleted(start, end);
      case 'failed':
        return await queue.getFailed(start, end);
      case 'delayed':
        return await queue.getDelayed(start, end);
      case 'paused':
        // Bull doesn't have getPaused method, return empty array
        return [];
      default:
        throw new Error(`Invalid job status: ${status}`);
    }
  }

  /**
   * Remove job from queue
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.debug(`Job ${jobId} removed from queue '${queueName}'`);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      this.logger.debug(`Job ${jobId} retried in queue '${queueName}'`);
    }
  }

  /**
   * Promote a delayed job
   */
  async promoteJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.promote();
      this.logger.debug(`Job ${jobId} promoted in queue '${queueName}'`);
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pause();
    this.logger.log(`Queue '${queueName}' paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resume();
    this.logger.log(`Queue '${queueName}' resumed`);
  }

  /**
   * Clean jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number,
    status: 'completed' | 'failed' | 'active',
    limit?: number,
  ): Promise<Job[]> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    // Bull only supports cleaning completed, failed, and active jobs
    const validStatuses = ['completed', 'failed', 'active'];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status for cleaning: ${status}. Valid statuses: ${validStatuses.join(', ')}`,
      );
    }

    const cleaned = await queue.clean(grace, status as any, limit);

    this.logger.log(
      `Cleaned ${cleaned.length} ${status} jobs from queue '${queueName}'`,
    );

    return cleaned;
  }

  /**
   * Get all registered queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Check if queue is healthy
   */
  async isQueueHealthy(queueName: string): Promise<boolean> {
    try {
      const queue = this.getQueue(queueName);
      if (!queue) {
        return false;
      }

      // Test Redis connection
      await queue.client.ping();
      return true;
    } catch (error) {
      this.logger.error(`Queue '${queueName}' health check failed`, error);
      return false;
    }
  }

  /**
   * Setup queue event listeners for monitoring
   */
  private setupQueueListeners(name: string, queue: Queue): void {
    queue.on('completed', (job: Job, result: any) => {
      this.logger.debug(`Job ${job.id} completed in queue '${name}'`);
    });

    queue.on('failed', (job: Job, err: Error) => {
      this.logger.warn(
        `Job ${job.id} failed in queue '${name}': ${err.message}`,
      );
    });

    queue.on('stalled', (job: Job) => {
      this.logger.warn(`Job ${job.id} stalled in queue '${name}'`);
    });

    queue.on('progress', (job: Job, progress: number) => {
      this.logger.debug(
        `Job ${job.id} progress in queue '${name}': ${progress}%`,
      );
    });

    queue.on('paused', () => {
      this.logger.log(`Queue '${name}' paused`);
    });

    queue.on('resumed', () => {
      this.logger.log(`Queue '${name}' resumed`);
    });

    queue.on('cleaned', (jobs: Job[], type: string) => {
      this.logger.log(`Queue '${name}' cleaned ${jobs.length} ${type} jobs`);
    });

    queue.on('error', (error: Error) => {
      this.logger.error(`Queue '${name}' error`, error);
    });
  }

  /**
   * Cleanup when service is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    for (const [name, queue] of this.queues) {
      try {
        await queue.close();
        this.logger.log(`Queue '${name}' closed`);
      } catch (error) {
        this.logger.error(`Error closing queue '${name}'`, error);
      }
    }
  }
}
