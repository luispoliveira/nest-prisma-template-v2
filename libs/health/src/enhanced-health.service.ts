import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { EnhancedPrismaHealthIndicator } from "./indicators/enhanced-prisma-health.indicator";
import { MongoHealthIndicator } from "./indicators/mongo-health.indicator";
import { QueueHealthIndicator } from "./indicators/queue-health.indicator";
import { RedisHealthIndicator } from "./indicators/redis-health.indicator";
import { SystemHealthIndicator } from "./indicators/system-health.indicator";

export interface EnhancedHealthCheckResult extends HealthCheckResult {
  metadata?: {
    version?: string;
    environment?: string;
    uptime: number;
    timestamp: string;
    checkDuration: number;
    dependencies: {
      database?: any;
      redis?: any;
      queues?: any;
      external?: any;
    };
  };
}

export interface HealthMetrics {
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
  loadAverage?: number[];
  diskUsage?: {
    total: number;
    used: number;
    free: number;
  };
}

@Injectable()
export class EnhancedHealthService {
  private readonly logger = new Logger(EnhancedHealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly httpIndicator: HttpHealthIndicator,
    private readonly memoryIndicator: MemoryHealthIndicator,
    private readonly diskIndicator: DiskHealthIndicator,
    private readonly enhancedPrismaIndicator: EnhancedPrismaHealthIndicator,
    private readonly queueHealthIndicator: QueueHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly mongoIndicator: MongoHealthIndicator,
    private readonly systemIndicator: SystemHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  async checkHealth(): Promise<EnhancedHealthCheckResult> {
    const startTime = Date.now();
    const checks = [];

    try {
      // Database check (Enhanced Prisma)
      if (this.configService.get("healthChecks.database.enabled", true)) {
        checks.push(() => this.enhancedPrismaIndicator.isHealthy("database"));
      }

      // Queue health check
      if (this.configService.get("healthChecks.queues.enabled", true)) {
        const queueNames = this.configService.get<string[]>("healthChecks.queues.names", []);
        checks.push(() => this.queueHealthIndicator.isHealthy("queues", queueNames));
      }

      // Redis check
      if (this.configService.get("healthChecks.redis.enabled", true)) {
        const redisOptions = {
          host: this.configService.get("healthChecks.redis.host", "localhost"),
          port: this.configService.get("healthChecks.redis.port", 6379),
          timeout: this.configService.get("healthChecks.redis.timeout", 3000),
        };
        checks.push(() => this.redisIndicator.isHealthy("redis", redisOptions));
      }

      // MongoDB check
      if (this.configService.get("healthChecks.mongo.enabled", false)) {
        const mongoOptions = {
          url: this.configService.get("healthChecks.mongo.url", "mongodb://localhost:27017"),
          timeout: this.configService.get("healthChecks.mongo.timeout", 3000),
        };
        checks.push(() => this.mongoIndicator.isHealthy("mongo", mongoOptions));
      }

      // System checks
      if (this.configService.get("healthChecks.system.memory.enabled", true)) {
        const memoryThreshold = this.configService.get(
          "healthChecks.system.memory.threshold",
          1024 * 1024 * 1024,
        ); // 1GB default
        checks.push(() => this.memoryIndicator.checkHeap("memory", memoryThreshold));
      }

      if (this.configService.get("healthChecks.system.disk.enabled", true)) {
        const diskThreshold = this.configService.get("healthChecks.system.disk.threshold", 0.9); // 90% default
        const diskPath = this.configService.get("healthChecks.system.disk.path", "/");
        checks.push(() =>
          this.diskIndicator.checkStorage("disk", {
            thresholdPercent: diskThreshold,
            path: diskPath,
          }),
        );
      }

      // External service checks
      const externalUrls = this.configService.get<string[]>("healthChecks.external.urls", []);
      for (const url of externalUrls) {
        const timeout = this.configService.get("healthChecks.external.timeout", 3000);
        checks.push(() => this.httpIndicator.pingCheck(`external-${url}`, url, { timeout }));
      }

      // Perform all health checks
      const result = await this.healthCheckService.check(checks);
      const duration = Date.now() - startTime;

      // Add enhanced metadata
      const enhancedResult: EnhancedHealthCheckResult = {
        ...result,
        metadata: {
          version: this.configService.get("app.version", "unknown"),
          environment: this.configService.get("NODE_ENV", "unknown"),
          uptime: Date.now() - this.startTime,
          timestamp: new Date().toISOString(),
          checkDuration: duration,
          dependencies: await this.getDependencyDetails(),
        },
      };

      this.logger.debug(`Health check completed in ${duration}ms`);
      return enhancedResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Health check failed after ${duration}ms:`, errorMessage);
      throw error;
    }
  }

  async checkLiveness(): Promise<{
    status: "ok";
    timestamp: string;
    uptime: number;
    version?: string;
  }> {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.configService.get("app.version"),
    };
  }

  async checkReadiness(): Promise<{
    status: "ready" | "not_ready";
    timestamp: string;
    checks: Record<string, any>;
  }> {
    const startTime = Date.now();

    try {
      // Only check critical services for readiness
      const criticalChecks = [];

      // Database is critical
      if (this.configService.get("healthChecks.database.enabled", true)) {
        criticalChecks.push(() => this.enhancedPrismaIndicator.isHealthy("database"));
      }

      // Queues might be critical depending on app
      if (this.configService.get("healthChecks.queues.critical", false)) {
        criticalChecks.push(() => this.queueHealthIndicator.isHealthy("queues"));
      }

      // Redis might be critical
      if (this.configService.get("healthChecks.redis.critical", false)) {
        const redisOptions = {
          host: this.configService.get("healthChecks.redis.host", "localhost"),
          port: this.configService.get("healthChecks.redis.port", 6379),
          timeout: this.configService.get("healthChecks.redis.timeout", 3000),
        };
        criticalChecks.push(() => this.redisIndicator.isHealthy("redis", redisOptions));
      }

      const result = await this.healthCheckService.check(criticalChecks);

      return {
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: result.details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.warn(`Readiness check failed after ${duration}ms:`, errorMessage);

      return {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        checks: error instanceof Error ? { error: error.message } : { error: "Unknown error" },
      };
    }
  }

  async getDetailedHealthReport(): Promise<{
    summary: {
      status: "healthy" | "unhealthy" | "degraded";
      timestamp: string;
      uptime: number;
      version?: string;
    };
    services: {
      database?: any;
      queues?: any;
      redis?: any;
      mongo?: any;
      system?: any;
      external?: any;
    };
    metrics: HealthMetrics;
    alerts?: Array<{
      service: string;
      type: string;
      severity: "low" | "medium" | "high" | "critical";
      message: string;
      timestamp: Date;
    }>;
  }> {
    const metrics = await this.getHealthMetrics();
    const services: any = {};
    const alerts: any[] = [];

    try {
      // Get detailed database health
      if (this.configService.get("healthChecks.database.enabled", true)) {
        try {
          const dbResult = await this.enhancedPrismaIndicator.isHealthy("database");
          services.database = dbResult.database;
        } catch (error) {
          services.database = {
            status: "down",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          alerts.push({
            service: "database",
            type: "connectivity",
            severity: "critical",
            message: "Database connection failed",
            timestamp: new Date(),
          });
        }
      }

      // Get detailed queue health
      if (this.configService.get("healthChecks.queues.enabled", true)) {
        try {
          const queueReport = await this.queueHealthIndicator.getDetailedQueueReport();
          services.queues = queueReport;

          // Add queue alerts
          for (const queue of queueReport.queues) {
            if (queue.alerts) {
              alerts.push(
                ...queue.alerts.map(alert => ({
                  service: `queue-${queue.name}`,
                  type: alert.type,
                  severity: alert.severity as any,
                  message: alert.message,
                  timestamp: alert.timestamp,
                })),
              );
            }
          }
        } catch (error) {
          services.queues = {
            status: "down",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      // Get system health
      try {
        const systemHealth = this.systemIndicator.getSystemInfo();
        services.system = systemHealth.system;
      } catch (error) {
        services.system = {
          status: "unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    } catch (error) {
      this.logger.error("Error generating detailed health report:", error);
    }

    // Determine overall status
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    const highAlerts = alerts.filter(a => a.severity === "high");

    if (criticalAlerts.length > 0) {
      overallStatus = "unhealthy";
    } else if (highAlerts.length > 0 || alerts.filter(a => a.severity === "medium").length > 3) {
      overallStatus = "degraded";
    }

    return {
      summary: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get("app.version"),
      },
      services,
      metrics,
      alerts: alerts.length > 0 ? alerts : undefined,
    };
  }

  async getHealthMetrics(): Promise<HealthMetrics> {
    const memoryUsage = process.memoryUsage();

    const metrics: HealthMetrics = {
      uptime: Date.now() - this.startTime,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
    };

    try {
      // Try to get CPU usage (Node.js 14+)
      if (process.cpuUsage) {
        const cpuUsage = process.cpuUsage();
        metrics.cpuUsage = {
          user: cpuUsage.user,
          system: cpuUsage.system,
        };
      }

      // Try to get load average (Unix-like systems only)
      if (process.platform !== "win32" && require("os").loadavg) {
        metrics.loadAverage = require("os").loadavg();
      }
    } catch (error) {
      this.logger.debug("Could not get additional system metrics:", error);
    }

    return metrics;
  }

  private async getDependencyDetails(): Promise<{
    database?: any;
    redis?: any;
    queues?: any;
    external?: any;
  }> {
    const dependencies: any = {};

    try {
      // Get database connection pool stats
      if (this.configService.get("healthChecks.database.enabled", true)) {
        try {
          const poolStats = await this.enhancedPrismaIndicator.getConnectionPoolStats();
          dependencies.database = { connectionPool: poolStats };
        } catch (error) {
          dependencies.database = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      // Get queue summary
      if (this.configService.get("healthChecks.queues.enabled", true)) {
        try {
          const queueReport = await this.queueHealthIndicator.getDetailedQueueReport();
          dependencies.queues = {
            summary: queueReport.summary,
            systemMetrics: queueReport.systemMetrics,
          };
        } catch (error) {
          dependencies.queues = { error: error instanceof Error ? error.message : "Unknown error" };
        }
      }
    } catch (error) {
      this.logger.debug("Error getting dependency details:", error);
    }

    return dependencies;
  }
}
