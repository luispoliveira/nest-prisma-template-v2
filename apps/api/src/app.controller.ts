import { LoggedUser } from "@lib/auth";
import { BaseAuthController } from "@lib/auth/controllers/base-auth.controller";
import { DefaultJob } from "@lib/queue";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { ClsService } from "nestjs-cls";
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
    private readonly _clsService: ClsService,
  ) {
    super();
  }

  // @Public()
  @Get()
  async getHello() {
    // await this._defaultJob.addTestJob();

    // wait 5 seconds
    // await new Promise(resolve => setTimeout(resolve, 5000));

    const user = this._clsService.get<LoggedUser>("user");
    console.log("🚀 ~ AppController ~ getHello ~ user:", user);

    await this._defaultJob.addAnotherTestJob();

    return this.appService.getHello();
  }
}
