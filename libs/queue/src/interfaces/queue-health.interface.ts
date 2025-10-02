/**
 * Queue health status levels
 */
export enum QueueHealthStatus {
  _HEALTHY = 'healthy',
  _WARNING = 'warning',
  _CRITICAL = 'critical',
  _UNKNOWN = 'unknown',
}

/**
 * Queue health check result
 */
export interface QueueHealthCheck {
  /** Queue name */
  queueName: string;

  /** Overall health status */
  status: QueueHealthStatus;

  /** Health score (0-100) */
  score: number;

  /** Detailed checks */
  checks: {
    /** Redis connection status */
    connection: {
      status: QueueHealthStatus;
      latency?: number;
      error?: string;
    };

    /** Queue processing status */
    processing: {
      status: QueueHealthStatus;
      activeJobs: number;
      stalledJobs: number;
      errorRate: number;
    };

    /** Memory usage check */
    memory: {
      status: QueueHealthStatus;
      usage: number;
      threshold: number;
    };

    /** Performance check */
    performance: {
      status: QueueHealthStatus;
      throughput: number;
      averageProcessingTime: number;
      queueSize: number;
    };
  };

  /** Health recommendations */
  recommendations: string[];

  /** Timestamp of health check */
  timestamp: Date;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * System-wide queue health summary
 */
export interface SystemQueueHealth {
  /** Overall system health status */
  overallStatus: QueueHealthStatus;

  /** Overall health score */
  overallScore: number;

  /** Individual queue health checks */
  queues: QueueHealthCheck[];

  /** System-wide metrics */
  systemMetrics: {
    totalQueues: number;
    healthyQueues: number;
    warningQueues: number;
    criticalQueues: number;
    totalJobs: number;
    totalActiveJobs: number;
    totalFailedJobs: number;
    systemMemoryUsage: number;
    redisConnectionStatus: QueueHealthStatus;
  };

  /** System recommendations */
  systemRecommendations: string[];

  /** Timestamp */
  timestamp: Date;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Health check interval in milliseconds */
  interval: number;

  /** Thresholds for health scoring */
  thresholds: {
    /** Queue size threshold for warnings */
    queueSizeWarning: number;
    queueSizeCritical: number;

    /** Error rate thresholds (percentage) */
    errorRateWarning: number;
    errorRateCritical: number;

    /** Processing time thresholds (milliseconds) */
    processingTimeWarning: number;
    processingTimeCritical: number;

    /** Memory usage thresholds (MB) */
    memoryUsageWarning: number;
    memoryUsageCritical: number;

    /** Connection latency thresholds (milliseconds) */
    connectionLatencyWarning: number;
    connectionLatencyCritical: number;
  };

  /** Whether to enable alerting */
  enableAlerting: boolean;

  /** Alert configuration */
  alertConfig?: {
    /** Webhook URL for alerts */
    webhookUrl?: string;

    /** Email configuration */
    email?: {
      to: string[];
      from: string;
      subject: string;
    };

    /** Slack configuration */
    slack?: {
      webhookUrl: string;
      channel: string;
    };
  };
}
