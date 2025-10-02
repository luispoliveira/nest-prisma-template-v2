import { Prisma } from '@gen/prisma-client';
import { LogLevel } from '@nestjs/common';
import { EnvironmentEnum } from '../enum/environment.enum';

export class LoggerUtil {
  static getLogger(environment: EnvironmentEnum) {
    const logger: LogLevel[] = ['error', 'warn'];

    switch (environment) {
      case EnvironmentEnum._DEVELOPMENT:
        break;
      case EnvironmentEnum._STAGING:
        logger.push('log');
        break;
    }

    return logger;
  }

  static getPrismaLogger(environment: EnvironmentEnum) {
    const logger: Prisma.LogLevel[] = ['error', 'warn'];

    switch (environment) {
      case EnvironmentEnum._DEVELOPMENT:
        logger.push('info', 'query');
        break;
      case EnvironmentEnum._STAGING:
        logger.push('info', 'query');
        break;
    }

    return logger;
  }
}
