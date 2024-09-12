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
});
