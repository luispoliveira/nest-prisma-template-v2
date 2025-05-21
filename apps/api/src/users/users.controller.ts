import { Prisma } from "@gen/prisma-client";
import { BaseAuthController, CurrentUser, LoggedUser } from "@lib/auth";
import { PasswordUtil } from "@lib/common";
import { PrismaErrorHandler, PrismaService } from "@lib/prisma";
import {
  Body,
  Controller,
  ForbiddenException,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import { ENHANCED_PRISMA } from "@zenstackhq/server/nestjs";
import { UpdateUserDto } from "./dto/user.dto";

@Controller("users")
export class UsersController extends BaseAuthController {
  constructor(@Inject(ENHANCED_PRISMA) private readonly _prismaService: PrismaService) {
    super();
  }

  @Patch("update/:id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: LoggedUser,
  ) {
    try {
      const { password, ...rest } = body;

      const data: Prisma.UserUpdateInput = {
        ...rest,
      };

      if (password) data.password = await PasswordUtil.hashPassword(password);

      return await this._prismaService.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.meta.reason === "ACCESS_POLICY_VIOLATION")
        throw new ForbiddenException("Access denied");

      throw PrismaErrorHandler.handlePrismaError(error);
    }
  }
}
