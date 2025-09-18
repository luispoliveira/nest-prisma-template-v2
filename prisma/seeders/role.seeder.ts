import { PrismaClient } from '@gen/prisma-client';
import { RBAC_ROLES } from '../../libs/common/src/types/rbac-permissions';

export default class RoleSeeder {
  private _prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this._prismaClient = prismaClient;
  }

  async createRoles() {
    console.debug('Creating roles ...');
    for (const role of Object.keys(RBAC_ROLES)) {
      await this._prismaClient.role.upsert({
        where: { name: role },
        update: {},
        create: {
          name: role,
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        },
      });
    }
    console.debug('Roles created.');
  }
}
