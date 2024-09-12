import * as Joi from 'joi';
import { EnvironmentEnum } from 'src/common/enum/environment.enum';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid(
      EnvironmentEnum.DEVELOPMENT,
      EnvironmentEnum.STAGING,
      EnvironmentEnum.PRODUCTION,
    )
    .default(EnvironmentEnum.DEVELOPMENT),
  DOCKER_POSTGRES_PATH: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string()
    .valid('1d', '7d', '14d', '30d')
    .required()
    .default('1d'),
  ADMIN_EMAIL: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),
});
