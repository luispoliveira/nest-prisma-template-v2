import { EnvironmentEnum } from '@lib/common';
import * as Joi from 'joi';
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(
      EnvironmentEnum._DEVELOPMENT,
      EnvironmentEnum._STAGING,
      EnvironmentEnum._PRODUCTION,
    )
    .default(EnvironmentEnum._DEVELOPMENT),
  DOCKER_POSTGRES_PATH: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  BACKUP_ENABLED: Joi.string().valid('true', 'false').default('false'),
  BACKUP_DIR: Joi.string().default('./backups'),
  BACKUP_FTP_ENABLED: Joi.string().valid('true', 'false').default('false'),
  BACKUP_FTP_HOST: Joi.string().when('BACKUP_FTP_ENABLED', {
    is: 'true',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  BACKUP_FTP_PORT: Joi.string().when('BACKUP_FTP_ENABLED', {
    is: 'true',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  BACKUP_FTP_USER: Joi.string().when('BACKUP_FTP_ENABLED', {
    is: 'true',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  BACKUP_FTP_REMOTE_DIR: Joi.string().default('/').when('BACKUP_FTP_ENABLED', {
    is: 'true',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
