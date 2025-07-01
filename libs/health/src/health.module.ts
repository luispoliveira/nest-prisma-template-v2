import { PrismaModule } from "@lib/prisma";
import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { MongoHealthIndicator } from "./indicators/mongo-health.indicator";
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
  ],
  providers: [HealthService, RedisHealthIndicator, MongoHealthIndicator, SystemHealthIndicator],
  exports: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
