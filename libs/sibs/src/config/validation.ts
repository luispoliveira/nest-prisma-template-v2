import * as Joi from 'joi';

export const validationSchema = Joi.object({
  SIBS_BASE_URL: Joi.string()
    .uri()
    .default('https://spg.qly.site1.sibs.pt/api/v2'),
  SIBS_TOKEN: Joi.string().required(),
  SIBS_CLIENT_ID: Joi.string().required(),
  SIBS_TERMINAL_ID: Joi.string().required(),
  SIBS_ENTITY: Joi.string().required(),
  SIBS_WEBHOOK_SECRET: Joi.string().required(),
});
