import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EnhancedQueueService } from "./services/enhanced-queue.service";
import { QueueDashboardService } from "./services/queue-dashboard.service";

@ApiTags("Queue")
@Controller("queue")
export class QueueController {
  constructor(
    private readonly queueService: EnhancedQueueService,
    private readonly dashboardService: QueueDashboardService,
  ) {}

  @Get("status")
  async getStatus(@Query("queue") queue = "default") {
    return this.queueService.getQueueStats(queue);
  }

  @Get("dashboard")
  async getDashboard() {
    return this.dashboardService.getDashboardData();
  }

  @Post("job")
  async addJob(@Body() body: { queue?: string; name: string; data: any; options?: any }) {
    const queue = body.queue || "default";
    return this.queueService.addJob(queue, body.name, body.data, body.options);
  }
}
