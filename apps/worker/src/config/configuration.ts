import { registerAs } from '@nestjs/config';

export interface WorkerConfig {
  concurrency: number;
  maxJobs: number;
  enabledConsumers: string[];
  healthCheck: {
    enabled: boolean;
    interval: number;
  };
  metrics: {
    enabled: boolean;
    collection: {
      performance: boolean;
      memory: boolean;
      jobs: boolean;
    };
  };
  retry: {
    attempts: number;
    delay: number;
  };
  cleanup: {
    enabled: boolean;
    interval: number;
    retentionDays: number;
  };
}

export const configuration = registerAs(
  'worker',
  (): WorkerConfig => ({
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10', 10),
    maxJobs: parseInt(process.env.WORKER_MAX_JOBS || '100', 10),
    enabledConsumers: process.env.WORKER_ENABLED_CONSUMERS?.split(',') || [
      'default',
      'email',
      'file-processing',
      'reporting',
    ],
    healthCheck: {
      enabled: process.env.WORKER_HEALTH_CHECK_ENABLED === 'true' || true,
      interval: parseInt(
        process.env.WORKER_HEALTH_CHECK_INTERVAL || '30000',
        10,
      ), // 30 seconds
    },
    metrics: {
      enabled: process.env.WORKER_METRICS_ENABLED === 'true' || true,
      collection: {
        performance: process.env.WORKER_METRICS_PERFORMANCE === 'true' || true,
        memory: process.env.WORKER_METRICS_MEMORY === 'true' || true,
        jobs: process.env.WORKER_METRICS_JOBS === 'true' || true,
      },
    },
    retry: {
      attempts: parseInt(process.env.WORKER_RETRY_ATTEMPTS || '3', 10),
      delay: parseInt(process.env.WORKER_RETRY_DELAY || '5000', 10),
    },
    cleanup: {
      enabled: process.env.WORKER_CLEANUP_ENABLED === 'true' || true,
      interval: parseInt(process.env.WORKER_CLEANUP_INTERVAL || '3600000', 10), // 1 hour
      retentionDays: parseInt(
        process.env.WORKER_CLEANUP_RETENTION_DAYS || '7',
        10,
      ),
    },
  }),
);
