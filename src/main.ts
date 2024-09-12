import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { GQL_APOLLO_HELMET } from './common/helpers/graphql.helper';
import { ConfigService } from '@nestjs/config';
import { EnvironmentEnum } from './common/enum/environment.enum';
import { LoggerUtil } from './common/utils/logger.utils';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);

  const port = configService.get<number>('port')!;
  const environment = configService.get<EnvironmentEnum>('environment')!;

  app.useLogger(LoggerUtil.getLogger(environment));

  app.use(
    helmet({
      ...GQL_APOLLO_HELMET,
    }),
  );
  await app.listen(port, async () => {
    Logger.log(
      `Server running on: ${await app.getUrl()} | http://localhost:${port}`,
      'Bootstrap',
    );
    Logger.log(`Environment: ${environment}`, 'Bootstrap');
  });
}
bootstrap();
