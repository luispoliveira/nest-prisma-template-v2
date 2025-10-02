import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    options: { host: string; port: number; timeout?: number },
  ): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    let redis: Redis | null = null;

    try {
      redis = new Redis({
        host: options.host,
        port: options.port,
        connectTimeout: options.timeout || 3000,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });

      await redis.connect();
      await redis.ping();

      const duration = Date.now() - startTime;
      const result = this.getStatus(key, true, {
        host: options.host,
        port: options.port,
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new HealthCheckError(
        `Redis health check failed`,
        this.getStatus(key, false, {
          host: options.host,
          port: options.port,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${duration}ms`,
        }),
      );
    } finally {
      if (redis) {
        redis.disconnect();
      }
    }
  }
}
