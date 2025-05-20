import { Public } from "@lib/auth";
import { BaseAuthController } from "@lib/auth/controllers/base-auth.controller";
import { DefaultJob } from "@lib/queue";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiHeader({
  name: "api-key",
  description: "API Key",
})
@ApiBearerAuth()
@Controller()
export class AppController extends BaseAuthController {
  constructor(
    private readonly appService: AppService,
    private readonly _defaultJob: DefaultJob,
  ) {
    super();
  }

  @Public()
  @Get()
  async getHello() {
    await this._defaultJob.addTestJob();

    // wait 5 seconds
    // await new Promise(resolve => setTimeout(resolve, 5000));

    await this._defaultJob.addAnotherTestJob();

    return this.appService.getHello();
  }
}
