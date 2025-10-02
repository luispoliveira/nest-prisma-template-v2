import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Worker Configuration
  WORKER_CONCURRENCY: Joi.number().default(10),
  WORKER_MAX_JOBS: Joi.number().default(100),
  WORKER_ENABLED_CONSUMERS: Joi.string().default(
    'default,email,file-processing,reporting',
  ),

  // Health Check
  WORKER_HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
  WORKER_HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // Metrics
  WORKER_METRICS_ENABLED: Joi.boolean().default(true),
  WORKER_METRICS_PERFORMANCE: Joi.boolean().default(true),
  WORKER_METRICS_MEMORY: Joi.boolean().default(true),
  WORKER_METRICS_JOBS: Joi.boolean().default(true),

  // Retry Configuration
  WORKER_RETRY_ATTEMPTS: Joi.number().default(3),
  WORKER_RETRY_DELAY: Joi.number().default(5000),

  // Cleanup
  WORKER_CLEANUP_ENABLED: Joi.boolean().default(true),
  WORKER_CLEANUP_INTERVAL: Joi.number().default(3600000),
  WORKER_CLEANUP_RETENTION_DAYS: Joi.number().default(7),
});
