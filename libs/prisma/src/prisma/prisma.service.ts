import { EnvironmentEnum, LoggerUtil } from "@lib/common";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly _configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: _configService.get("databaseUrl"),
    });

    const environment = _configService.get<EnvironmentEnum>("environment")!;
    const logPrisma = _configService.get<boolean>("logPrisma")!;

    super({
      adapter,
      log: logPrisma ? LoggerUtil.getPrismaLogger(environment) : [],
      errorFormat: "pretty",
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
