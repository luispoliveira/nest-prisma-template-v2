import { PrismaClient } from '@prisma/client';
import { PasswordUtil, RoleEnum } from '../libs/common/src';
import PermissionSeeder from './seeders/permission.seeder';
import RoleSeeder from './seeders/role.seeder';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const roleSeeder = new RoleSeeder(prisma);
  const permissionSeeder = new PermissionSeeder(prisma);

  await roleSeeder.createRoles();
  await permissionSeeder.createPermissions();

  await ensureAdmin();

  console.log('Seeding finished.');
}



async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await PasswordUtil.hashPassword(adminPassword),
      isActive: true,
      Role2User: {
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

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
