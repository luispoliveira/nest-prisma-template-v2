import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class RbacService {
  constructor(private readonly _prismaService: PrismaService) {}

  async userHasPermissions(userId: number, permissions: string[]) {
    const userPermissions = await this.getUserPermissions(userId);

    return userPermissions.some((permission) =>
      permissions.includes(permission),
    );
  }

  async getUserRoles(userId: number) {
    const allRoles: string[] = [];
    const roles = await this._prismaService.role.findMany({
      where: {
        isActive: true,
        Role2User: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
    });

    roles.map((role) => {
      if (!allRoles.includes(role.name)) {
        allRoles.push(role.name);
      }
    });

    return allRoles;
  }

  async getUserPermissions(userId: number) {
    const allPermissions: string[] = [];

    const permissions = await this._prismaService.permission.findMany({
      where: {
        Permission2User: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
    });

    permissions.map((permission) => {
      if (!allPermissions.includes(permission.name)) {
        allPermissions.push(permission.name);
      }
    });

    const roles = await this._prismaService.role.findMany({
      where: {
        isActive: true,
        Role2User: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      include: {
        Permission2Role: {
          where: {
            isActive: true,
          },
          include: {
            permission: true,
          },
        },
      },
    });

    roles.map((role) => {
      role.Permission2Role.map((permission) => {
        if (!allPermissions.includes(permission.permission.name)) {
          allPermissions.push(permission.permission.name);
        }
      });
    });

    return allPermissions;
  }
}
