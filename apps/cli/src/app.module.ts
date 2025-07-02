import { PrismaModule } from "@lib/prisma";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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
  ],
  providers: [AppCommand],
})
export class AppModule {}
