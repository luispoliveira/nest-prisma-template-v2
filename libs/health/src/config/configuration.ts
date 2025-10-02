import { EnvironmentEnum } from '@lib/common';

export const configuration = () => ({
  environment: process.env.NODE_ENV || EnvironmentEnum._DEVELOPMENT,
  healthChecks: {
    database: {
      enabled: process.env.HEALTH_CHECK_DATABASE_ENABLED !== 'false',
      timeout: parseInt(
        process.env.HEALTH_CHECK_DATABASE_TIMEOUT || '5000',
        10,
      ),
    },
    redis: {
      enabled: process.env.HEALTH_CHECK_REDIS_ENABLED !== 'false',
      timeout: parseInt(process.env.HEALTH_CHECK_REDIS_TIMEOUT || '3000', 10),
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    mongodb: {
      enabled: process.env.HEALTH_CHECK_MONGODB_ENABLED !== 'false',
      timeout: parseInt(process.env.HEALTH_CHECK_MONGODB_TIMEOUT || '5000', 10),
      url: process.env.MONGO_DATABASE_URL,
    },
    memory: {
      enabled: process.env.HEALTH_CHECK_MEMORY_ENABLED !== 'false',
      heapThresholdBytes: parseInt(
        process.env.HEALTH_CHECK_MEMORY_HEAP_THRESHOLD || '157286400',
        10,
      ), // 150MB
      rssThresholdBytes: parseInt(
        process.env.HEALTH_CHECK_MEMORY_RSS_THRESHOLD || '314572800',
        10,
      ), // 300MB
    },
    disk: {
      enabled: process.env.HEALTH_CHECK_DISK_ENABLED !== 'false',
      path: process.env.HEALTH_CHECK_DISK_PATH || '/',
      thresholdPercent: parseFloat(
        process.env.HEALTH_CHECK_DISK_THRESHOLD || '0.9',
      ), // 90%
    },
    external: {
      enabled: process.env.HEALTH_CHECK_EXTERNAL_ENABLED !== 'false',
      urls: process.env.HEALTH_CHECK_EXTERNAL_URLS?.split(',') || [
        'https://www.google.com',
      ],
      timeout: parseInt(
        process.env.HEALTH_CHECK_EXTERNAL_TIMEOUT || '5000',
        10,
      ),
    },
  },
});
