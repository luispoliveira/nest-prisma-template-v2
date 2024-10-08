import { PrismaClient } from '@prisma/client';
import { RoleEnum } from './../../libs/common/src/enum/role.enum';

export default class RoleSeeder {
  private _prismaClient: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this._prismaClient = prismaClient;
  }

  async createRoles() {
    console.debug('Creating roles ...');
    for (const role of Object.values(RoleEnum)) {
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
