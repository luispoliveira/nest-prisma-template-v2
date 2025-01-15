import { BullModule, BullModuleAsyncOptions } from "@nestjs/bull";
import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { DefaultJob } from "./jobs/default.job";

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
            host: configService.get("redis.host"),
            port: configService.get("redis.port"),
          },
        }),
        inject: [ConfigService],
      });
    }

    return {
      module: QueueModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
        }),
        BullModule.registerQueueAsync(...configs),
      ],
      providers: [DefaultJob],
      exports: [DefaultJob],
    };
  }
}
