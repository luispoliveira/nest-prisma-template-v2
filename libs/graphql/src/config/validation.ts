import { EnvironmentEnum } from "@lib/common";
import * as Joi from "joi";
export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid(EnvironmentEnum.DEVELOPMENT, EnvironmentEnum.STAGING, EnvironmentEnum.PRODUCTION)
    .default(EnvironmentEnum.DEVELOPMENT),
});
