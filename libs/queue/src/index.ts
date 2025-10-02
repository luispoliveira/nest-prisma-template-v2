// Queue Library Main Exports
export * from './jobs/default.job';
export * from './queue.const';
export * from './queue.module';
export * from './services/enhanced-queue.service';
export * from './services/queue-dashboard.service';
export * from './services/queue-integration.service';
export * from './services/queue-monitoring.service';

// Re-export specific interfaces to avoid naming conflicts
export {
  BulkJobData,
  EnhancedJobOptions,
  JobData,
  JobEvent,
  JobMetrics,
  JobStatus,
} from './interfaces/job.interface';

// Note: Additional interfaces for queue stats and health are available in the respective service files
// Import them directly from the services or interface files as needed:
// - QueueStats (from enhanced-queue.service)
// - Extended interfaces (from interfaces/queue-stats.interface and interfaces/queue-health.interface)
