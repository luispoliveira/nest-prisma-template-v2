import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrevoMailService } from './brevo-mail.service';
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';
import { MAIL_MODULE_OPTIONS, MAIL_SERVICE } from './constants';
import { MailModuleOptions } from './interfaces';

@Global()
@Module({})
export class MailModule {
  static forRootAsync(opts: {
    useFactory: (
      ...args: any[]
    ) => Promise<MailModuleOptions> | MailModuleOptions;
    inject?: any[];
  }): DynamicModule {
    const asyncOptionsProvider = {
      provide: MAIL_MODULE_OPTIONS,
      useFactory: opts.useFactory,
      inject: opts.inject || [],
    };

    const mailProvider = {
      provide: MAIL_SERVICE,
      useFactory: (options: MailModuleOptions) => {
        if (options.provider === 'brevo') return new BrevoMailService(options);
        throw new Error(`Unsupported mail provider: ${options.provider}`);
      },
      inject: [MAIL_MODULE_OPTIONS],
    };

    return {
      module: MailModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema,
        }),
      ],
      providers: [asyncOptionsProvider, mailProvider],
      exports: [mailProvider],
    };
  }
}
