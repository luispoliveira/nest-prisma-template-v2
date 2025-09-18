import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { MongoHealthIndicator } from './indicators/mongo-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { SystemHealthIndicator } from './indicators/system-health.indicator';
import {
  HealthStatus,
  LivenessResponse,
  ReadinessResponse,
} from './interfaces/health.interface';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly httpIndicator: HttpHealthIndicator,
    private readonly diskIndicator: DiskHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly mongoIndicator: MongoHealthIndicator,
    private readonly systemIndicator: SystemHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const checks = [];

    // Database check
    if (this.configService.get('healthChecks.database.enabled')) {
      checks.push(() => this.checkDatabase());
    }

    // Redis check
    if (
      this.configService.get('healthChecks.redis.enabled') &&
      this.configService.get('healthChecks.redis.host')
    ) {
      checks.push(() => this.checkRedis());
    }

    // MongoDB check
    if (
      this.configService.get('healthChecks.mongodb.enabled') &&
      this.configService.get('healthChecks.mongodb.url')
    ) {
      checks.push(() => this.checkMongoDB());
    }

    // Memory check
    if (this.configService.get('healthChecks.memory.enabled')) {
      checks.push(() => this.checkMemory());
    }

    // Disk check
    if (this.configService.get('healthChecks.disk.enabled')) {
      checks.push(() => this.checkDisk());
    }

    // External services check
    if (this.configService.get('healthChecks.external.enabled')) {
      checks.push(() => this.checkExternalServices());
    }

    try {
      return await this.healthCheckService.check(checks);
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw error;
    }
  }

  async getDetailedHealth(): Promise<HealthStatus> {
    try {
      const result = await this.checkHealth();

      // Convert HealthIndicatorResult to our format
      const convertToDetails = (data: any) => {
        const details: Record<string, any> = {};
        Object.keys(data || {}).forEach(key => {
          details[key] = {
            status: data[key]?.status === 'up' ? 'up' : 'down',
            timestamp: new Date().toISOString(),
            ...data[key],
          };
        });
        return details;
      };

      return {
        status: 'ok',
        info: convertToDetails(result.info),
        error: convertToDetails(result.error),
        details: convertToDetails(result.details),
      };
    } catch (error) {
      this.logger.error('Detailed health check failed', error);
      const errorCauses =
        error && typeof error === 'object' && 'causes' in error
          ? error.causes
          : {};
      return {
        status: 'error',
        info: {},
        error: (errorCauses as Record<string, any>) || {},
        details: (errorCauses as Record<string, any>) || {},
      };
    }
  }

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      version: process.env.npm_package_version,
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const checks: Record<string, any> = {};

    try {
      // Quick essential checks for readiness
      if (this.configService.get('healthChecks.database.enabled')) {
        checks.database = await this.checkDatabase();
      }

      if (
        this.configService.get('healthChecks.redis.enabled') &&
        this.configService.get('healthChecks.redis.host')
      ) {
        checks.redis = await this.checkRedis();
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      };
    } catch (error) {
      this.logger.warn('Readiness check failed', error);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
      };
    }
  }

  getSystemInfo() {
    return this.systemIndicator.getSystemInfo();
  }

  private async checkDatabase() {
    try {
      const timeout = this.configService.get('healthChecks.database.timeout');
      return await Promise.race([
        this.prismaIndicator.pingCheck('database', this.prismaService),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Database check timeout')),
            timeout,
          ),
        ),
      ]);
    } catch (error) {
      this.logger.error('Database health check failed', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Database health check failed: ${errorMessage}`);
    }
  }

  private async checkRedis() {
    const config = this.configService.get('healthChecks.redis');
    return this.redisIndicator.isHealthy('redis', {
      host: config.host,
      port: config.port,
      timeout: config.timeout,
    });
  }

  private async checkMongoDB() {
    const config = this.configService.get('healthChecks.mongodb');
    return this.mongoIndicator.isHealthy('mongodb', {
      url: config.url,
      timeout: config.timeout,
    });
  }

  private checkMemory() {
    const config = this.configService.get('healthChecks.memory');
    return this.systemIndicator.checkMemoryUsage('memory', {
      heapThreshold: config.heapThresholdBytes,
      rssThreshold: config.rssThresholdBytes,
    });
  }

  private checkDisk() {
    const config = this.configService.get('healthChecks.disk');
    return this.diskIndicator.checkStorage('disk', {
      path: config.path,
      thresholdPercent: config.thresholdPercent,
    });
  }

  private async checkExternalServices() {
    const config = this.configService.get('healthChecks.external');
    const promises = config.urls.map((url: string) =>
      this.httpIndicator.pingCheck(
        `external_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
        url,
        {
          timeout: config.timeout,
        },
      ),
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled');

    if (successful.length === 0) {
      throw new Error('All external service checks failed');
    }

    // Return the first successful result
    return (successful[0] as PromiseFulfilledResult<any>).value;
  }
}
