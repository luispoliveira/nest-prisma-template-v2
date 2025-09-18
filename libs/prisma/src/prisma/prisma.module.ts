import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { configuration } from '../config/configuration';
import { validationSchema } from '../config/validation';
import { BackupService } from './backup.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
  ],
  providers: [PrismaService, BackupService],
  exports: [PrismaService],
})
export class PrismaModule {}
