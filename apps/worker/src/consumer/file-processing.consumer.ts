import { QUEUES } from "@lib/queue";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";

@Processor(QUEUES.DEFAULT)
export class FileProcessingConsumer {
  @Process("process-file")
  async processFile(job: Job) {
    // Simulate file processing
    console.log(`[FileProcessingConsumer] Processing file:`, job.data);
    // TODO: Integrate with file processing logic
  }
}
