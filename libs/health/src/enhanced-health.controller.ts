import { BaseAuthController } from "@lib/auth";
import { Controller, Get, Logger, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { HealthCheck, HealthCheckResult, HealthCheckService } from "@nestjs/terminus";
import { EnhancedHealthCheckResult, EnhancedHealthService } from "./enhanced-health.service";
import { HealthService } from "./health.service";

@ApiTags("Health")
@Controller("health")
export class EnhancedHealthController extends BaseAuthController {
  private readonly logger = new Logger(EnhancedHealthController.name);

  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly healthService: HealthService,
    private readonly enhancedHealthService: EnhancedHealthService,
  ) {
    super();
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Check application health" })
  @ApiResponse({ status: 200, description: "Application is healthy" })
  @ApiResponse({ status: 503, description: "Application is unhealthy" })
  async check(): Promise<HealthCheckResult> {
    return this.healthService.checkHealth();
  }

  @Get("enhanced")
  @ApiOperation({ summary: "Enhanced health check with detailed metrics" })
  @ApiResponse({ status: 200, description: "Enhanced health information" })
  @ApiResponse({ status: 503, description: "Application is unhealthy" })
  async checkEnhanced(): Promise<EnhancedHealthCheckResult> {
    const startTime = Date.now();
    try {
      const result = await this.enhancedHealthService.checkHealth();
      const duration = Date.now() - startTime;
      this.logger.debug(`Enhanced health check completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Enhanced health check failed after ${duration}ms:`, error);
      throw error;
    }
  }

  @Get("detailed")
  @ApiOperation({ summary: "Detailed health report with comprehensive diagnostics" })
  @ApiResponse({ status: 200, description: "Detailed health report" })
  async getDetailedReport() {
    const startTime = Date.now();
    try {
      const report = await this.enhancedHealthService.getDetailedHealthReport();
      const duration = Date.now() - startTime;
      this.logger.debug(`Detailed health report generated in ${duration}ms`);
      return report;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to generate detailed health report after ${duration}ms:`, error);
      throw error;
    }
  }

  @Get("liveness")
  @ApiOperation({ summary: "Kubernetes liveness probe" })
  @ApiResponse({ status: 200, description: "Application is alive" })
  async checkLiveness() {
    return this.enhancedHealthService.checkLiveness();
  }

  @Get("readiness")
  @ApiOperation({ summary: "Kubernetes readiness probe" })
  @ApiResponse({ status: 200, description: "Application is ready" })
  @ApiResponse({ status: 503, description: "Application is not ready" })
  async checkReadiness() {
    const result = await this.enhancedHealthService.checkReadiness();

    if (result.status === "not_ready") {
      // Return 503 status for not ready
      const error = new Error("Application not ready");
      (error as any).status = 503;
      throw error;
    }

    return result;
  }

  @Get("metrics")
  @ApiOperation({ summary: "Get health metrics" })
  @ApiResponse({ status: 200, description: "Health metrics" })
  async getMetrics() {
    return this.enhancedHealthService.getHealthMetrics();
  }

  @Get("system")
  @ApiOperation({ summary: "Get system information" })
  @ApiResponse({ status: 200, description: "System information" })
  async getSystemInfo() {
    return this.healthService.getSystemInfo();
  }

  @Get("database")
  @ApiOperation({ summary: "Get detailed database health information" })
  @ApiResponse({ status: 200, description: "Database health details" })
  @ApiQuery({
    name: "includeStats",
    required: false,
    type: Boolean,
    description: "Include connection pool statistics",
  })
  async getDatabaseHealth(@Query("includeStats") includeStats?: boolean) {
    const startTime = Date.now();
    try {
      // Get database health from the detailed report
      const report = await this.enhancedHealthService.getDetailedHealthReport();
      const duration = Date.now() - startTime;

      return {
        database: report.services.database,
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Database health check failed after ${duration}ms:`, error);
      throw error;
    }
  }

  @Get("queues")
  @ApiOperation({ summary: "Get queue health information" })
  @ApiResponse({ status: 200, description: "Queue health details" })
  @ApiQuery({
    name: "queueNames",
    required: false,
    type: [String],
    description: "Specific queue names to check",
  })
  async getQueueHealth(@Query("queueNames") queueNames?: string | string[]) {
    const startTime = Date.now();
    try {
      // Parse queue names if provided
      let queues: string[] | undefined;
      if (queueNames) {
        queues = Array.isArray(queueNames) ? queueNames : [queueNames];
      }

      // This endpoint would specifically check queue health
      // We can create a specific method for this or use the detailed report
      const report = await this.enhancedHealthService.getDetailedHealthReport();
      const duration = Date.now() - startTime;

      return {
        queues: report.services.queues,
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Queue health check failed after ${duration}ms:`, error);
      throw error;
    }
  }

  @Get("alerts")
  @ApiOperation({ summary: "Get current health alerts" })
  @ApiResponse({ status: 200, description: "Current alerts" })
  @ApiQuery({
    name: "severity",
    required: false,
    enum: ["low", "medium", "high", "critical"],
    description: "Filter by severity",
  })
  async getAlerts(@Query("severity") severity?: "low" | "medium" | "high" | "critical") {
    const report = await this.enhancedHealthService.getDetailedHealthReport();

    let alerts = report.alerts || [];

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return {
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("performance")
  @ApiOperation({ summary: "Get performance metrics" })
  @ApiResponse({ status: 200, description: "Performance metrics" })
  async getPerformanceMetrics() {
    const metrics = await this.enhancedHealthService.getHealthMetrics();
    const report = await this.enhancedHealthService.getDetailedHealthReport();

    return {
      system: metrics,
      services: {
        database: report.services.database,
        queues: report.services.queues?.systemMetrics,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
