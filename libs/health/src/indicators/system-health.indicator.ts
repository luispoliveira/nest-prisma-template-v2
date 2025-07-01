import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult } from "@nestjs/terminus";
import * as os from "os";

@Injectable()
export class SystemHealthIndicator extends HealthIndicator {
  checkMemoryUsage(
    key: string,
    options: { heapThreshold: number; rssThreshold: number },
  ): HealthIndicatorResult {
    const memoryUsage = process.memoryUsage();
    const isHealthy =
      memoryUsage.heapUsed <= options.heapThreshold && memoryUsage.rss <= options.rssThreshold;

    const result = this.getStatus(key, isHealthy, {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      heapThreshold: `${Math.round(options.heapThreshold / 1024 / 1024)}MB`,
      rssThreshold: `${Math.round(options.rssThreshold / 1024 / 1024)}MB`,
    });

    return result;
  }

  getSystemInfo(): HealthIndicatorResult {
    const systemInfo = {
      nodeVersion: process.version,
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
      uptime: `${Math.round(process.uptime())}s`,
      loadAverage: os.loadavg(),
    };

    return this.getStatus("system", true, systemInfo);
  }

  checkProcessUptime(key: string, minUptimeMs?: number): HealthIndicatorResult {
    const uptimeMs = process.uptime() * 1000;
    const isHealthy = minUptimeMs ? uptimeMs >= minUptimeMs : true;

    return this.getStatus(key, isHealthy, {
      uptime: `${Math.round(uptimeMs / 1000)}s`,
      uptimeMs,
      ...(minUptimeMs && { minUptimeMs }),
    });
  }
}
