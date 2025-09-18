import { PrismaClient } from '@gen/prisma-client';
import { Role } from '@lib/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PasswordUtil } from '../libs/common/src';
import PermissionSeeder from './seeders/permission.seeder';
import RoleSeeder from './seeders/role.seeder';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});

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
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn(
      'ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set. Skipping admin user creation.',
    );
    return;
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: await PasswordUtil.hashPassword(adminPassword),
      isActive: true,
      role: {
        connect: { name: 'admin' as Role },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
