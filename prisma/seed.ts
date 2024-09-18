import { PrismaClient } from '@prisma/client';
import { PasswordUtil, PermissionEnum, RoleEnum } from '../libs/common/src';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');
  await createRoles();
  await createPermissions();
  await ensureAdmin();

  console.log('Seeding finished.');
}

async function createPermissions() {
  for (const permission of Object.values(PermissionEnum)) {
    const module = permission.split('_')[0];
    await prisma.permission.upsert({
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
}

async function createRoles() {
  for (const role of Object.values(RoleEnum)) {
    await prisma.role.upsert({
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
