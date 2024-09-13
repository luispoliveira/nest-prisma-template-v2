import { EnvironmentEnum, GQL_APOLLO_HELMET, LoggerUtil } from '@lib/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

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
