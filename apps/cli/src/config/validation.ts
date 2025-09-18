import { EnvironmentEnum } from '@lib/common';
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(
      EnvironmentEnum.DEVELOPMENT,
      EnvironmentEnum.STAGING,
      EnvironmentEnum.PRODUCTION,
    )
    .default(EnvironmentEnum.DEVELOPMENT),
  DOCKER_POSTGRES_PATH: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
});
