import { EnvironmentEnum, LoggerUtil } from "@lib/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { CommandModule, CommandService } from "nestjs-command";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const environment = configService.get<EnvironmentEnum>("environment")!;

  app.useLogger(LoggerUtil.getLogger(environment));

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    console.error(error);
    await app.close();
    process.exit(1);
  }
}
bootstrap();
