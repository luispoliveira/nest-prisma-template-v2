import { PrismaModule } from "@lib/prisma";
import { QueueModule, QUEUES } from "@lib/queue";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { EnhancedHealthController } from "./enhanced-health.controller";
import { EnhancedHealthService } from "./enhanced-health.service";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { EnhancedPrismaHealthIndicator } from "./indicators/enhanced-prisma-health.indicator";
import { MongoHealthIndicator } from "./indicators/mongo-health.indicator";
import { QueueHealthIndicator } from "./indicators/queue-health.indicator";
import { RedisHealthIndicator } from "./indicators/redis-health.indicator";
import { SystemHealthIndicator } from "./indicators/system-health.indicator";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
    }),
    TerminusModule,
    HttpModule,
    PrismaModule,
    QueueModule.register([QUEUES.DEFAULT]), // Import queue module with default queue
  ],
  providers: [
    HealthService,
    EnhancedHealthService,
    RedisHealthIndicator,
    MongoHealthIndicator,
    SystemHealthIndicator,
    EnhancedPrismaHealthIndicator,
    QueueHealthIndicator,
  ],
  exports: [HealthService, EnhancedHealthService],
  controllers: [HealthController, EnhancedHealthController],
})
export class HealthModule {}
