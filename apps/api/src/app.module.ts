import { AuditModule } from "@app/audit";
import { RbacModule } from "@lib/auth";
import { GraphqlModule } from "@lib/graphql";
import { PrismaModule, PrismaService } from "@lib/prisma";
import { QueueModule, QUEUES } from "@lib/queue";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { enhance } from "@zenstackhq/runtime";
import { ZenStackModule } from "@zenstackhq/server/nestjs";
import { ClsModule, ClsService } from "nestjs-cls";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
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
        limit: 100,
      },
    ]),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    AuditModule,
    PrismaModule,
    ZenStackModule.registerAsync({
      global: true,
      useFactory: (...args: unknown[]) => {
        const [prisma, cls] = args as [PrismaService, ClsService];
        return {
          getEnhancedPrisma: () => enhance(prisma, { user: cls.get("user") }),
        };
      },
      inject: [PrismaService, ClsService],
      extraProviders: [PrismaService],
    }),
    GraphqlModule.register(),
    RbacModule,
    QueueModule.register([QUEUES.DEFAULT]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
