import { BullModule, BullModuleAsyncOptions } from '@nestjs/bull';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { DefaultJob } from './jobs/default.job';
import { QUEUES } from './queue.const';
import { QueueController } from './queue.controller';
import { EnhancedQueueService } from './services/enhanced-queue.service';
import { QueueDashboardService } from './services/queue-dashboard.service';
import { QueueIntegrationService } from './services/queue-integration.service';
import { QueueMonitoringService } from './services/queue-monitoring.service';

export const ALL_QUEUES = [QUEUES.DEFAULT, QUEUES.EMAIL];

@Global()
@Module({})
export class QueueModule {
  static register(queuesName: string[]): DynamicModule {
    const configs: BullModuleAsyncOptions[] = [];

    for (const queueName of queuesName) {
      configs.push({
        imports: [ConfigModule],
        name: queueName,
        useFactory: (configService: ConfigService) => ({
          redis: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
        }),
        inject: [ConfigService],
      });
    }

    // Store queue names for the integration service
    QueueIntegrationService.setQueueNames(queuesName);

    return {
      global: true,
      module: QueueModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
        }),
        BullModule.registerQueueAsync(...configs),
      ],
      providers: [
        DefaultJob,
        EnhancedQueueService,
        QueueMonitoringService,
        QueueDashboardService,
        QueueIntegrationService,
      ],
      controllers: [QueueController], // Add controllers if needed
      exports: [
        DefaultJob,
        EnhancedQueueService,
        QueueMonitoringService,
        QueueDashboardService,
        QueueIntegrationService,
        BullModule, // Export BullModule to make queue instances available for injection
      ],
    };
  }
}
