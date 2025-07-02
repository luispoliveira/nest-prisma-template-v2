import { QUEUES } from "@lib/queue";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";

@Processor(QUEUES.DEFAULT)
export class ReportingConsumer {
  @Process("generate-report")
  async generateReport(job: Job) {
    // Simulate report generation
    console.log(`[ReportingConsumer] Generating report:`, job.data);
    // TODO: Integrate with reporting logic
  }
}
