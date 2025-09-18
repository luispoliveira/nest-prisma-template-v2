import { Injectable } from '@nestjs/common';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  responseTime?: number;
  timestamp: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: Record<string, HealthCheckResult>;
  timestamp: string;
}

@Injectable()
export class HealthCheckUtil {
  /**
   * Check database connectivity
   */
  static async checkDatabase(
    connectionCallback: () => Promise<any>,
  ): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      await connectionCallback();
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - start;

      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        details: { error: (error as Error).message },
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  static async checkRedis(redisClient: any): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      await redisClient.ping();
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        message: 'Redis connection successful',
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - start;

      return {
        status: 'unhealthy',
        message: 'Redis connection failed',
        details: { error: (error as Error).message },
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check external API connectivity
   */
  static async checkExternalAPI(
    name: string,
    url: string,
    timeout = 5000,
  ): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;

      if (response.ok) {
        return {
          status: 'healthy',
          message: `External API ${name} is accessible`,
          responseTime,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          status: 'degraded',
          message: `External API ${name} returned ${response.status}`,
          details: {
            statusCode: response.status,
            statusText: response.statusText,
          },
          responseTime,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      const responseTime = Date.now() - start;

      return {
        status: 'unhealthy',
        message: `External API ${name} is unreachable`,
        details: { error: (error as Error).message },
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check memory usage
   */
  static checkMemoryUsage(maxUsagePercent = 80): HealthCheckResult {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const usagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    let message = 'Memory usage is normal';

    if (usagePercent > maxUsagePercent) {
      status = 'degraded';
      message = 'Memory usage is high';
    }

    if (usagePercent > 95) {
      status = 'unhealthy';
      message = 'Memory usage is critically high';
    }

    return {
      status,
      message,
      details: {
        usedMB,
        totalMB,
        usagePercent: Math.round(usagePercent),
        rss: Math.round(usage.rss / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check disk space (Node.js doesn't have native disk space check, this is a placeholder)
   */
  static checkDiskSpace(): HealthCheckResult {
    // This would require a native module or external command
    // For now, we'll return a healthy status
    return {
      status: 'healthy',
      message: 'Disk space check not implemented',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Aggregate multiple health checks
   */
  static async performHealthChecks(
    checks: Record<string, () => Promise<HealthCheckResult>>,
  ): Promise<SystemHealth> {
    const services: Record<string, HealthCheckResult> = {};
    const results = await Promise.allSettled(
      Object.entries(checks).map(async ([name, check]) => {
        const result = await check();
        return { name, result };
      }),
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services[result.value.name] = result.value.result;
      } else {
        const checkName = Object.keys(checks)[index] || 'unknown';
        services[checkName] = {
          status: 'unhealthy',
          message: 'Health check failed to execute',
          details: { error: result.reason },
          timestamp: new Date().toISOString(),
        };
      }
    });

    // Determine overall health
    const statuses = Object.values(services).map(s => s.status);
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (statuses.some(s => s === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (statuses.some(s => s === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a simple health check endpoint response
   */
  static createSimpleHealthResponse(healthy: boolean, message?: string) {
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      message:
        message || (healthy ? 'Service is healthy' : 'Service is unhealthy'),
      timestamp: new Date().toISOString(),
    };
  }
}
