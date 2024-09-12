import { configuration } from './config/configuration';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from './config/validation';
import { PrismaModule } from 'nestjs-prisma';
import { LoggerUtil } from './common/utils/logger.utils';
import { EnvironmentEnum } from './common/enum/environment.enum';
import { Prisma } from '@prisma/client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 10,
      },
    ]),
    PrismaModule.forRootAsync({
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
