import { Prisma } from '@gen/prisma-client';
import { BaseAuthController, CurrentUser, LoggedUser } from '@lib/auth';
import { PasswordUtil, TokenUtil } from '@lib/common';
import { PrismaErrorHandler, PrismaService } from '@lib/prisma';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ENHANCED_PRISMA } from '@zenstackhq/server/nestjs';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController extends BaseAuthController {
  constructor(
    @Inject(ENHANCED_PRISMA) private readonly _prismaService: PrismaService,
  ) {
    super();
  }

  @Get('')
  async findAll() {
    return await this._prismaService.user.findMany({
      include: {
        role: true,
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this._prismaService.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });
  }

  @Post('')
  async create(@Body() body: CreateUserDto) {
    try {
      return await this._prismaService.user.create({
        data: body,
      });
    } catch (error: any) {
      throw PrismaErrorHandler.handlePrismaError(error);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
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
      throw PrismaErrorHandler.handlePrismaError(error);
    }
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: LoggedUser,
  ) {
    try {
      const token = TokenUtil.generate();

      const user = await this._prismaService.user.update({
        where: { id },
        data: {
          resetPasswordToken: token,
          resetPasswordTokenExpiresAt: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000,
          ), // 3 days,
          isActive: false,
        },
      });

      /**
       * send email to user
       */
      return user;
    } catch (error: any) {
      throw PrismaErrorHandler.handlePrismaError(error);
    }
  }

  @Patch(':id/activate')
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: LoggedUser,
  ) {
    return await this._prismaService.user.update({
      where: { id },
      data: {
        isActive: true,
        activatedAt: new Date(),
        activatedBy: user.email,
      },
    });
  }

  @Patch(':id/deactivate')
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: LoggedUser,
  ) {
    return await this._prismaService.user.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: user.email,
      },
    });
  }

  @Patch(':id/role')
  async alterRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role', ParseIntPipe) roleId: number,
    @CurrentUser() user: LoggedUser,
  ) {
    try {
      return await this._prismaService.user.update({
        where: { id },
        data: { role: { connect: { id: roleId } } },
      });
    } catch (error: any) {
      throw PrismaErrorHandler.handlePrismaError(error);
    }
  }
}
