import { JobOptions } from 'bull';

/**
 * Interface for type-safe job data
 */
export interface JobData {
  [key: string]: any;
}

/**
 * Enhanced job options with additional configurations
 */
export interface EnhancedJobOptions extends JobOptions {
  /**
   * Job priority (higher number = higher priority)
   */
  priority?: number;

  /**
   * Job timeout in milliseconds
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts
   */
  attempts?: number;

  /**
   * Backoff strategy for retries
   */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };

  /**
   * Whether to remove the job after completion
   */
  removeOnComplete?: boolean | number;

  /**
   * Whether to remove the job after failure
   */
  removeOnFail?: boolean | number;

  /**
   * Job tags for categorization
   */
  tags?: string[];

  /**
   * Job metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for bulk job operations
 */
export interface BulkJobData<T = JobData> {
  name: string;
  data: T;
  opts?: EnhancedJobOptions;
}

/**
 * Job lifecycle events
 */
export type JobEvent =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'removed'
  | 'stalled';

/**
 * Job status information
 */
export interface JobStatus {
  id: string | number;
  name: string;
  data: JobData;
  opts: JobOptions;
  progress: number;
  delay: number;
  timestamp: number;
  attemptsMade: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
  finishedOn?: number;
  processedOn?: number;
}

/**
 * Job metrics for monitoring
 */
export interface JobMetrics {
  id: string | number;
  name: string;
  status: JobEvent;
  processingTime?: number;
  memoryUsage?: number;
  attempts: number;
  timestamp: Date;
  error?: string;
}
