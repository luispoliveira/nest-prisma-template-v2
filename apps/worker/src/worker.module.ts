import { HealthModule } from "@lib/health";
import { PrismaModule } from "@lib/prisma";
import { QueueModule, QUEUES } from "@lib/queue";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { DefaultConsumer } from "./consumer/default.consumer";
import { EmailConsumer } from "./consumer/email.consumer";
import { FileProcessingConsumer } from "./consumer/file-processing.consumer";
import { ReportingConsumer } from "./consumer/reporting.consumer";
import { WorkerHealthService } from "./services/worker-health.service";
import { WorkerMetricsService } from "./services/worker-metrics.service";
import { WorkerService } from "./worker.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    QueueModule.register([QUEUES.DEFAULT]),
    HealthModule,
  ],
  controllers: [],
  providers: [
    WorkerService,
    DefaultConsumer,
    EmailConsumer,
    FileProcessingConsumer,
    ReportingConsumer,
    WorkerHealthService,
    WorkerMetricsService,
  ],
})
export class WorkerModule {}
