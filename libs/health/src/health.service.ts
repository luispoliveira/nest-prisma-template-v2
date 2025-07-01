import { PrismaService } from "@lib/prisma";
import { Injectable } from "@nestjs/common";
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
@Injectable()
export class HealthService {
  constructor(
    private readonly _healthCheckService: HealthCheckService,
    private readonly _httpIndicator: HttpHealthIndicator,
    private readonly _diskIndicator: DiskHealthIndicator,
    private readonly _memoryIndicator: MemoryHealthIndicator,
    private readonly _prismaIndicator: PrismaHealthIndicator,
    private readonly _prismaService: PrismaService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    return this._healthCheckService.check([
      () => this.#checkDatabase(),
      () => this.#checkMemory(),
      () => this.#checkDisk(),
      () => this._httpIndicator.pingCheck("google", "https://www.google.com"),
    ]);
  }

  async #checkDatabase() {
    try {
      return await this._prismaIndicator.pingCheck("database", this._prismaService);
    } catch (e) {
      throw new Error("Database health check failed");
    }
  }

  async #checkMemory() {
    return this._memoryIndicator.checkHeap("memory_heap", 150 * 1024 * 1024);
  }

  async #checkDisk() {
    return this._diskIndicator.checkStorage("storage", {
      path: "/",
      thresholdPercent: 0.9, // 90%
    });
  }
}
