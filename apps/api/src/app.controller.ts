import { BaseAuthController, Public } from '@lib/auth';
import { MAIL_SERVICE, SendEmailInterface } from '@lib/mail';
import { DefaultJob } from '@lib/queue';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ClsService } from 'nestjs-cls';
import { AppService } from './app.service';

@ApiHeader({
  name: 'api-key',
  description: 'API Key',
})
@ApiBearerAuth()
@Controller()
export class AppController extends BaseAuthController {
  constructor(
    private readonly appService: AppService,
    private readonly _defaultJob: DefaultJob,
    private readonly _clsService: ClsService,
    @Inject(MAIL_SERVICE) private mailService: SendEmailInterface,
  ) {
    super();
  }

  @Public()
  @Get()
  async getHello() {
    await this.mailService.sendEmail({
      to: [{ email: 'support@targx.com', name: 'TargX Support' }],
      subject: 'Test Email from NestJS',
      text: 'This is a test email sent from the NestJS application using Brevo.',
      templateId: 8,
      params: {
        NAME: 'TargX',
        MESSAGE:
          'This is a test email sent from the NestJS application using Brevo.',
        ARRAY: ['one', 'two', 'three'],
      },
      // html: "<h1>This is a test email sent from the NestJS application using Brevo.</h1>",
    });

    return this.appService.getHello();
  }
}
