import { ApiKeyUtil } from "@lib/common";
import { PrismaService } from "@lib/prisma";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, "api-key") {
  constructor(private readonly _prismaService: PrismaService) {
    super(
      {
        header: "api-key",
        prefix: "",
      },
      true,
    );
  }
  async validate(apiKey: string) {
    const apiKeyRecord = await this._prismaService.apiKey.findUnique({
      where: { key: ApiKeyUtil.encode(apiKey), isActive: true },
    });

    if (!apiKeyRecord) throw new UnauthorizedException();

    if (!apiKeyRecord.isActive) throw new UnauthorizedException();

    const currentDate = new Date();

    if (apiKeyRecord.expiresAt < currentDate) throw new UnauthorizedException();

    return apiKeyRecord;
  }
}
