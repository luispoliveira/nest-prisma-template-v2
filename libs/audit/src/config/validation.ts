import { EnvironmentEnum } from '@lib/common';
import * as Joi from 'joi';
export const validationSchema = Joi.object({
  MONGO_DATABASE_URL: Joi.string().uri().required(),
  NODE_ENV: Joi.string()
    .valid(
      EnvironmentEnum.DEVELOPMENT,
      EnvironmentEnum.STAGING,
      EnvironmentEnum.PRODUCTION,
    )
    .default(EnvironmentEnum.DEVELOPMENT),
});
