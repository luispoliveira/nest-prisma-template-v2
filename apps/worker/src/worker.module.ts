import { HealthModule } from "@lib/health";
import { PrismaModule, PrismaService } from "@lib/prisma";
import { ALL_QUEUES, QueueModule } from "@lib/queue";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { enhance } from "@zenstackhq/runtime";
import { ZenStackModule } from "@zenstackhq/server/nestjs";
import { ClsService } from "nestjs-cls";
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
    QueueModule.register(ALL_QUEUES),
    HealthModule,
    ZenStackModule.registerAsync({
      global: true,
      useFactory: (...args: unknown[]) => {
        const [prisma, cls] = args as [PrismaService, ClsService];
        return {
          getEnhancedPrisma: () =>
            enhance(
              prisma,
              { user: cls.get("user") },
              {
                kinds: ["policy", "validation", "delegate", "password", "omit", "encryption"],
              },
            ),
        };
      },
      inject: [PrismaService, ClsService],
      extraProviders: [PrismaService],
    }),
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
