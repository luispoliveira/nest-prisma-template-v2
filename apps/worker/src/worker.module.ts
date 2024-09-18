import { PrismaModule } from '@lib/prisma';
import { QueueModule, QUEUES } from '@lib/queue';
import { Module } from '@nestjs/common';
import { DefaultConsumer } from './consumer/default.consumer';
import { WorkerService } from './worker.service';

@Module({
  imports: [PrismaModule.register(), QueueModule.register([QUEUES.DEFAULT])],
  controllers: [],
  providers: [WorkerService, DefaultConsumer],
})
export class WorkerModule {}
