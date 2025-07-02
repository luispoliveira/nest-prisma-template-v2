import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthCheckResult } from "@nestjs/terminus";
import { HealthService } from "./health.service";
import { HealthStatus, LivenessResponse, ReadinessResponse } from "./interfaces/health.interface";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Complete health check endpoint" })
  @ApiResponse({ status: 200, description: "Health check passed" })
  @ApiResponse({ status: 503, description: "Health check failed" })
  check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get("detailed")
  @ApiOperation({ summary: "Detailed health check with custom format" })
  @ApiResponse({ status: 200, description: "Detailed health status" })
  detailedCheck(): Promise<HealthStatus> {
    return this.healthService.getDetailedHealth();
  }

  @Get("liveness")
  @ApiOperation({ summary: "Liveness probe - indicates if the application is running" })
  @ApiResponse({ status: 200, description: "Application is alive" })
  liveness(): LivenessResponse {
    return this.healthService.getLiveness();
  }

  @Get("readiness")
  @ApiOperation({
    summary: "Readiness probe - indicates if the application is ready to serve traffic",
  })
  @ApiResponse({ status: 200, description: "Application is ready" })
  @ApiResponse({ status: 503, description: "Application is not ready" })
  readiness(): Promise<ReadinessResponse> {
    return this.healthService.getReadiness();
  }

  @Get("system")
  @ApiOperation({ summary: "System information and metrics" })
  @ApiResponse({ status: 200, description: "System information" })
  systemInfo() {
    return this.healthService.getSystemInfo();
  }
}
