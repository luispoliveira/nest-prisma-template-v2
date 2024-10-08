import { PrismaClient } from '@prisma/client';
import { PermissionEnum } from '../../libs/common/src/enum/permission.enum';
import { RoleEnum } from '../../libs/common/src/enum/role.enum';

export default class PermissionSeeder {
  private _prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this._prismaClient = prismaClient;
  }

  async createPermissions() {
    console.debug('Creating permissions ...');
    for (const permission of Object.values(PermissionEnum)) {
      const module = permission.split('_')[0];
      await this._prismaClient.permission.upsert({
        where: { name: permission },
        update: {},
        create: {
          name: permission,
          module,
          isActive: true,
          Permission2Role: {
            create: {
              role: { connect: { name: RoleEnum.ADMIN } },
              isActive: true,
              createdBy: 'system',
              updatedBy: 'system',
            },
          },
        },
      });
    }
    console.debug('Permissions created.');
  }
}
