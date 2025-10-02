import * as Joi from 'joi';

export const validationSchema = Joi.object({
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
});
