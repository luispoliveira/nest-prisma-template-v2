import { Prisma } from '@gen/prisma-client';
import { BaseAuthController } from '@lib/auth';
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
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('roles')
@ApiTags('Roles')
export class RolesController extends BaseAuthController {
  constructor(
    @Inject(ENHANCED_PRISMA) private readonly _prismaService: PrismaService,
  ) {
    super();
  }

  @Get('')
  async findAll() {
    return await this._prismaService.role.findMany({
      include: {
        Permission2Role: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this._prismaService.role.findUnique({
      where: { id },
      include: {
        Permission2Role: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  @Get(':id/permissions')
  async permissions(@Param('id', ParseIntPipe) id: number) {
    return await this._prismaService.permission.findMany({
      where: {
        Permission2Role: {
          some: {
            roleId: id,
          },
        },
      },
    });
  }

  @Post('')
  async create(@Body() body: CreateRoleDto) {
    try {
      return await this._prismaService.role.create({
        data: {
          name: body.name,
        },
      });
    } catch (e) {
      throw PrismaErrorHandler.handlePrismaError(e);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRoleDto,
  ) {
    const data: Prisma.RoleUpdateInput = {
      ...body,
    };

    try {
      return await this._prismaService.role.update({
        where: { id },
        data,
      });
    } catch (e) {
      throw PrismaErrorHandler.handlePrismaError(e);
    }
  }

  @Post(':id/permissions/:permissionId')
  async addPermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    try {
      return await this._prismaService.permission2Role.create({
        data: {
          roleId: id,
          permissionId,
        },
      });
    } catch (e) {
      throw PrismaErrorHandler.handlePrismaError(e);
    }
  }

  @Patch(':id/permissions/:permissionId')
  async removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    try {
      return await this._prismaService.permission2Role.delete({
        where: {
          permissionId_roleId: {
            permissionId,
            roleId: id,
          },
        },
      });
    } catch (e) {
      throw PrismaErrorHandler.handlePrismaError(e);
    }
  }
}
