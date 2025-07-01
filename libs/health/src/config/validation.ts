import { EnvironmentEnum } from "@lib/common";
import * as Joi from "joi";

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(EnvironmentEnum.DEVELOPMENT, EnvironmentEnum.STAGING, EnvironmentEnum.PRODUCTION)
    .default(EnvironmentEnum.DEVELOPMENT),

  // Database health check
  HEALTH_CHECK_DATABASE_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_DATABASE_TIMEOUT: Joi.number().min(1000).max(30000).default(5000),

  // Redis health check
  HEALTH_CHECK_REDIS_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_REDIS_TIMEOUT: Joi.number().min(1000).max(30000).default(3000),
  REDIS_HOST: Joi.string().when("HEALTH_CHECK_REDIS_ENABLED", {
    is: "true",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  REDIS_PORT: Joi.number().port().default(6379),

  // MongoDB health check
  HEALTH_CHECK_MONGODB_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_MONGODB_TIMEOUT: Joi.number().min(1000).max(30000).default(5000),
  MONGO_DATABASE_URL: Joi.string().when("HEALTH_CHECK_MONGODB_ENABLED", {
    is: "true",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Memory health check
  HEALTH_CHECK_MEMORY_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_MEMORY_HEAP_THRESHOLD: Joi.number()
    .min(50 * 1024 * 1024)
    .default(150 * 1024 * 1024), // Min 50MB
  HEALTH_CHECK_MEMORY_RSS_THRESHOLD: Joi.number()
    .min(100 * 1024 * 1024)
    .default(300 * 1024 * 1024), // Min 100MB

  // Disk health check
  HEALTH_CHECK_DISK_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_DISK_PATH: Joi.string().default("/"),
  HEALTH_CHECK_DISK_THRESHOLD: Joi.number().min(0.1).max(0.99).default(0.9),

  // External services health check
  HEALTH_CHECK_EXTERNAL_ENABLED: Joi.string().valid("true", "false").default("true"),
  HEALTH_CHECK_EXTERNAL_URLS: Joi.string().default("https://www.google.com"),
  HEALTH_CHECK_EXTERNAL_TIMEOUT: Joi.number().min(1000).max(30000).default(5000),
});
