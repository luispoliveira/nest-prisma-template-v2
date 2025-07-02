import { ALL_QUEUES, QueueModule } from "@lib/queue";
import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";

@Module({
  imports: [QueueModule.register(ALL_QUEUES)],
  providers: [QueueService],
})
export class QueueManagementModule {}
