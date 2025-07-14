import { ALL_QUEUES, QueueModule } from "@lib/queue";
import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { QueueStressTestCommand } from "./stress-test.command";

@Module({
  imports: [QueueModule.register(ALL_QUEUES)],
  providers: [QueueService, QueueStressTestCommand],
})
export class QueueManagementModule {}
