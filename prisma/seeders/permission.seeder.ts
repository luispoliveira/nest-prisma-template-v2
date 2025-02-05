import { PrismaClient } from "@prisma/client";
import { RBAC_ROLES } from "../../libs/common/src/types/rbac-permissions";
export default class PermissionSeeder {
  private _prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this._prismaClient = prismaClient;
  }

  async createPermissions() {
    console.debug("Creating permissions ...");

    for (const role of Object.keys(RBAC_ROLES)) {
      const permissions = RBAC_ROLES[role as keyof typeof RBAC_ROLES];
      const roleModel = await this._prismaClient.role.findUniqueOrThrow({
        where: {
          name: role,
        },
      });
      for (const permission of permissions) {
        const [permissionName, module] = permission.split(":");
        const permissionObject = await this._prismaClient.permission.upsert({
          where: {
            name: permission,
          },
          create: {
            name: permission,
            module,
          },
          update: {},
        });

        await this._prismaClient.permission2Role.upsert({
          where: {
            permissionId_roleId: {
              permissionId: permissionObject.id,
              roleId: roleModel.id,
            },
          },
          create: {
            permissionId: permissionObject.id,
            roleId: roleModel.id,
          },
          update: {},
        });
      }
    }

    console.debug("Permissions created.");
  }
}
