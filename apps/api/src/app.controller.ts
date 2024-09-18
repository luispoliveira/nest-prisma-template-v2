import { NeedsPermissions } from '@lib/auth';
import { BaseAuthController } from '@lib/auth/controllers/base-auth.controller';
import { PermissionEnum } from '@lib/common';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiHeader({
  name: 'api-key',
  description: 'API Key',
})
@ApiBearerAuth()
@Controller()
export class AppController extends BaseAuthController {
  constructor(private readonly appService: AppService) {
    super();
  }

  // @Public()
  @NeedsPermissions(PermissionEnum.USER_CREATE)
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
