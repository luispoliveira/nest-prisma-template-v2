import * as Joi from 'joi';
export const validationSchema = Joi.object({
  BREVO_API_KEY: Joi.string(),
  MAIL_DEFAULT_FROM_EMAIL: Joi.string().email().required(),
  MAIL_DEFAULT_FROM_NAME: Joi.string().optional().allow(''),
});
