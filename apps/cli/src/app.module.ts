import { PrismaModule, PrismaService } from "@lib/prisma";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { enhance } from "@zenstackhq/runtime";
import { ZenStackModule } from "@zenstackhq/server/nestjs";
import { ClsService } from "nestjs-cls";
import { CommandModule } from "nestjs-command";
import { ApiKeysModule } from "./api-keys/api-keys.module";
import { AppCommand } from "./app.command";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { DatabaseModule } from "./database/database.module";
import { HelpModule } from "./help/help.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { QueueManagementModule } from "./queue/queue.module";
import { RolesModule } from "./roles/roles.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    PrismaModule,
    CommandModule,
    ApiKeysModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DatabaseModule,
    QueueManagementModule,
    HelpModule,
    ZenStackModule.registerAsync({
      global: true,
      useFactory: (...args: unknown[]) => {
        const [prisma, cls] = args as [PrismaService, ClsService];
        return {
          getEnhancedPrisma: () =>
            enhance(
              prisma,
              { user: cls.get("user") },
              {
                kinds: ["policy", "validation", "delegate", "password", "omit", "encryption"],
              },
            ),
        };
      },
      inject: [PrismaService, ClsService],
      extraProviders: [PrismaService],
    }),
  ],
  providers: [AppCommand],
})
export class AppModule {}
