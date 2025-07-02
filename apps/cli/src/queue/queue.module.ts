import { QueueModule, QUEUES } from "@lib/queue";
import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";

@Module({
  imports: [QueueModule.register([QUEUES.DEFAULT])],
  providers: [QueueService],
})
export class QueueManagementModule {}
