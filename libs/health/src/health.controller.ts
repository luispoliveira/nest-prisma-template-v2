import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { HealthCheckResult } from "@nestjs/terminus";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "Health check passed" })
  @ApiResponse({ status: 503, description: "Health check failed" })
  check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get("liveness")
  @ApiOperation({ summary: "Liveness probe" })
  liveness() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("readiness")
  @ApiOperation({ summary: "Readiness probe" })
  async readiness() {
    // Add any startup checks here
    return { status: "ready", timestamp: new Date().toISOString() };
  }
}
