import { BaseApiKeyController } from '@lib/auth/controllers/base-api-key.controller';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiHeader({
  name: 'api-key',
  description: 'API Key',
})
@ApiBearerAuth()
@Controller()
export class AppController extends BaseApiKeyController {
  constructor(private readonly appService: AppService) {
    super();
  }

  // @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
