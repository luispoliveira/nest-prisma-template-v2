import { Prisma } from '@gen/prisma-client';
import { LogLevel } from '@nestjs/common';
import { EnvironmentEnum } from '../enum/environment.enum';

export class LoggerUtil {
  static getLogger(environment: EnvironmentEnum) {
    const logger: LogLevel[] = ['error', 'warn'];

    switch (environment) {
      case EnvironmentEnum.DEVELOPMENT:
        logger.push('log', 'debug', 'verbose');
        break;
      case EnvironmentEnum.STAGING:
        logger.push('log');
        break;
    }

    return logger;
  }

  static getPrismaLogger(environment: EnvironmentEnum) {
    const logger: Prisma.LogLevel[] = ['error', 'warn'];

    switch (environment) {
      case EnvironmentEnum.DEVELOPMENT:
        logger.push('info', 'query');
        break;
      case EnvironmentEnum.STAGING:
        logger.push('info', 'query');
        break;
    }

    return logger;
  }
}
