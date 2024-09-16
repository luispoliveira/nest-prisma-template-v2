import { EnvironmentEnum, LoggerUtil } from '@lib/common';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule as Prisma, PrismaService } from 'nestjs-prisma';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
@Module({})
export class PrismaModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: PrismaModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
        }),
        Prisma.forRootAsync({
          isGlobal: true,
          useFactory: (config: ConfigService) => {
            const environment = config.get<EnvironmentEnum>('environment')!;

            return {
              prismaOptions: {
                log: LoggerUtil.getPrismaLogger(environment),
              },
            };
          },
          inject: [ConfigService],
        }),
      ],
      providers: [PrismaService],
      exports: [PrismaService],
    };
  }
}
