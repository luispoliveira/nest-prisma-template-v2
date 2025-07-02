import { AuditModule } from "@lib/audit";
import { RbacModule } from "@lib/auth";
import { GraphqlModule } from "@lib/graphql";
import { HealthModule } from "@lib/health";
import { PrismaModule, PrismaService } from "@lib/prisma";
import { ALL_QUEUES, QueueModule } from "@lib/queue";
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
import { PermissionsModule } from "./permissions/permissions.module";
import { QueueController } from "./queue.controller";
import { RolesModule } from "./roles/roles.module";
import { UsersModule } from "./users/users.module";
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
    HealthModule,
    GraphqlModule.register(),
    RbacModule,
    QueueModule.register(ALL_QUEUES),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
  controllers: [AppController, QueueController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
})
export class AppModule {}
