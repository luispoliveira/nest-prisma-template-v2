import { ApiKeyUtil } from "@lib/common";
import { PrismaService } from "@lib/prisma";
import { Injectable } from "@nestjs/common";
import { Command, Option, Positional } from "nestjs-command";

@Injectable()
export class ApiKeysService {
  constructor(private readonly _prismaService: PrismaService) {}

  @Command({
    command: "api-keys:create <name>",
    describe: "Create a new API key",
  })
  async create(
    @Positional({
      name: "name",
      describe: "The name of the API key to create",
      type: "string",
      alias: "n",
    })
    name: string,
    @Option({
      name: "description",
      describe: "The description of the API key",
      type: "string",
      required: false,
      alias: "d",
    })
    description: string,
  ) {
    console.log("Creating API key", name, description);

    const key = ApiKeyUtil.generateApiKey();

    /**
     * get date in 100 years
     */

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    const apiKey = await this._prismaService.apiKey.create({
      data: {
        name,
        description,
        key: ApiKeyUtil.encode(key),
        expiresAt,
      },
    });
    console.log("🚀 ~ ApiKeysService ~ key:", key);
  }
}
