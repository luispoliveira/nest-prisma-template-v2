import { EnvironmentEnum } from '@lib/common';

export const configuration = () => ({
  environment: process.env.NODE_ENV || EnvironmentEnum.DEVELOPMENT,
  logPrisma: process.env.LOG_PRISMA === 'true',
});
