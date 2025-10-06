import { AuditModule } from '@lib/audit';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { SibsHttpService } from './services/sibs-http.service';
import { SibsWebhookService } from './services/sibs-webhook.service';
import { SibsService } from './sibs.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
    }),
    AuditModule,
  ],
  providers: [SibsService, SibsHttpService, SibsWebhookService],
  exports: [SibsService, SibsWebhookService],
})
export class SibsModule {}
