import { EnvironmentEnum } from '@lib/common';

export const configuration = () => ({
  environment: process.env.NODE_ENV || EnvironmentEnum.DEVELOPMENT,
  port: parseInt(process.env.PORT!, 10) || 3000,
});
