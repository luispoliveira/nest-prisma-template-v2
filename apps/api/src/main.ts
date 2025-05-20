import { PrismaModel } from "@gen/prisma-class-generator";
import { EnvironmentEnum, GQL_APOLLO_HELMET, LoggerUtil } from "@lib/common";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const configService = app.get(ConfigService);

  const port = configService.get<number>("port")!;
  const environment = configService.get<EnvironmentEnum>("environment")!;

  app.setGlobalPrefix("api");

  app.useLogger(LoggerUtil.getLogger(environment));

  app.use(
    helmet({
      ...GQL_APOLLO_HELMET,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("API")
    .setDescription("API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", in: "header", name: "api-key" })
    .addTag("API")
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [...PrismaModel.extraModels],
  });
  SwaggerModule.setup("api/api-docs", app, swaggerDocument, {
    jsonDocumentUrl: "swagger/json",
  });

  await app.listen(port, async () => {
    Logger.log(`Server running on: ${await app.getUrl()} | http://localhost:${port}`, "Bootstrap");
    Logger.log(`Environment: ${environment}`, "Bootstrap");
    Logger.debug(`Se chegou até aqui, você é um gênio!`, "Bootstrap");
  });
}
bootstrap();
