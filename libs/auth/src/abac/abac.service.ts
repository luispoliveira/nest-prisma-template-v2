import { ABAC_ROLES, AbacPermissions, RolesWithPermissions } from "@lib/common";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { LoggedUser } from "../models/user.model";
@Injectable()
export class AbacService {
  constructor(private readonly _prismaService: PrismaService) {}

  async hasPermission<Resource extends keyof AbacPermissions>(
    user: LoggedUser,
    resource: Resource,
    action: AbacPermissions[Resource]["action"],
    data?: AbacPermissions[Resource]["dataType"],
  ) {
    return user.roles.some(role => {
      const permission = (ABAC_ROLES as RolesWithPermissions)[role][resource]?.[action];

      if (permission == null) return false;

      if (typeof permission === "boolean") return permission;

      return data != null && permission(user, data);
    });
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

    roles.map(role => {
      if (!allRoles.includes(role.name)) {
        allRoles.push(role.name);
      }
    });

    return allRoles;
  }
}
