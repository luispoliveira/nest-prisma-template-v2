import { BaseAuthController } from "@lib/auth";
import { PrismaService } from "@lib/prisma";
import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@Controller("permissions")
@ApiTags("Permissions")
export class PermissionsController extends BaseAuthController {
  constructor(private readonly _prismaService: PrismaService) {
    super();
  }

  @Get("")
  async findAll() {
    return await this._prismaService.permission.findMany();
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return await this._prismaService.permission.findUnique({
      where: { id },
    });
  }
}
