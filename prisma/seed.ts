import { PrismaClient } from '@prisma/client';
import { PasswordUtil } from '../libs/common/src';
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

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
