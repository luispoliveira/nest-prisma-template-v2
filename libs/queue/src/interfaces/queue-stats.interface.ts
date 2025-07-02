/**
 * Queue statistics interface
 */
export interface QueueStats {
  /** Queue name */
  name: string;

  /** Number of jobs waiting to be processed */
  waiting: number;

  /** Number of jobs currently being processed */
  active: number;

  /** Number of jobs completed successfully */
  completed: number;

  /** Number of jobs that failed */
  failed: number;

  /** Number of jobs delayed for future processing */
  delayed: number;

  /** Number of jobs that are paused */
  paused: number;

  /** Total number of jobs in the queue */
  total: number;

  /** Queue processing rate (jobs per minute) */
  processingRate?: number;

  /** Average job processing time in milliseconds */
  averageProcessingTime?: number;

  /** Queue memory usage */
  memoryUsage?: number;

  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Extended queue statistics with performance metrics
 */
export interface ExtendedQueueStats extends QueueStats {
  /** Error rate percentage */
  errorRate: number;

  /** Throughput (jobs processed per hour) */
  throughput: number;

  /** Peak processing time */
  peakProcessingTime: number;

  /** Minimum processing time */
  minProcessingTime: number;

  /** Standard deviation of processing times */
  processingTimeStdDev: number;

  /** Number of stalled jobs */
  stalled: number;

  /** Queue health score (0-100) */
  healthScore: number;
}

/**
 * Queue performance metrics over time
 */
export interface QueuePerformanceMetrics {
  /** Queue name */
  queueName: string;

  /** Time period for metrics */
  period: {
    start: Date;
    end: Date;
  };

  /** Total jobs processed in period */
  totalProcessed: number;

  /** Total jobs failed in period */
  totalFailed: number;

  /** Average processing time */
  avgProcessingTime: number;

  /** Peak processing time */
  peakProcessingTime: number;

  /** Throughput (jobs per hour) */
  throughput: number;

  /** Error rate percentage */
  errorRate: number;

  /** Memory usage statistics */
  memoryStats: {
    min: number;
    max: number;
    avg: number;
  };

  /** Job distribution by status */
  statusDistribution: {
    completed: number;
    failed: number;
    retried: number;
    stalled: number;
  };
}
