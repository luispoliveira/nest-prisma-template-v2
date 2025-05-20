import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AuditService } from "./audit.service";
import { configuration } from "./config/configuration";
import { validationSchema } from "./config/validation";
import { LogService } from "./log/log.service";
import { Log, LogSchema } from "./schemas/log.schema";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("mongoDatabaseUrl"),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: Log.name,
        schema: LogSchema,
      },
    ]),
  ],
  providers: [AuditService, LogService],
  exports: [AuditService, LogService],
})
export class AuditModule {}
