import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from 'nestjs-prisma';
import { AppController } from './app.controller';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { EnvironmentEnum, LoggerUtil } from '@app/common';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { UsersModule } from './users/users.module';
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
    GraphQLModule.forRoot({
      debug: process.env['NODE_ENV'] === EnvironmentEnum.DEVELOPMENT,
      playground: false,
      driver: ApolloDriver,
      useGlobalPrefix: true,
      plugins:
        process.env['NODE_ENV'] === EnvironmentEnum.PRODUCTION
          ? [ApolloServerPluginLandingPageProductionDefault()]
          : [ApolloServerPluginLandingPageLocalDefault()],
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      persistedQueries: false,
      autoSchemaFile: true,
      sortSchema: true,
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    AppService,
    AppResolver,
  ],
})
export class AppModule {}
