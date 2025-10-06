import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { LogService } from './log/log.service';
import { SibsLogService } from './log/sibs-log.service';
import { Log, LogSchema } from './schemas/log.schema';
import { SibsLog, SibsLogSchema } from './schemas/sibs-log.schema';

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
        uri: configService.get('mongoDatabaseUrl'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: Log.name,
        schema: LogSchema,
      },
      {
        name: SibsLog.name,
        schema: SibsLogSchema,
      },
    ]),
  ],
  providers: [AuditService, LogService, SibsLogService],
  exports: [AuditService, LogService, SibsLogService],
})
export class AuditModule {}
