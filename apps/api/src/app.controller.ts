import { LoggedUser } from "@lib/auth";
import { BaseAuthController } from "@lib/auth/controllers/base-auth.controller";
import { DefaultJob } from "@lib/queue";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ClsService } from "nestjs-cls";
import { RBAcAsyncPermissions } from "nestjs-rbac";
import { AppService } from "./app.service";

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
  @RBAcAsyncPermissions("user@create")
  async getHello() {
    // await this._defaultJob.addTestJob();

    // wait 5 seconds
    // await new Promise(resolve => setTimeout(resolve, 5000));

    const user = this._clsService.get<LoggedUser>("user");

    await this._defaultJob.addAnotherTestJob();

    return this.appService.getHello();
  }
}
