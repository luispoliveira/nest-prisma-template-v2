import { EnvironmentEnum, LoggerUtil } from '@lib/common';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule as Prisma, PrismaService } from 'nestjs-prisma';
@Module({})
export class PrismaModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: PrismaModule,
      imports: [
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
