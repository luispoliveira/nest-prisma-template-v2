import { PrismaModule } from '@lib/prisma';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandModule } from 'nestjs-command';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AppCommand } from './app.command';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    PrismaModule.register(),
    CommandModule,
    ApiKeysModule,
  ],
  providers: [AppCommand],
})
export class AppModule {}
