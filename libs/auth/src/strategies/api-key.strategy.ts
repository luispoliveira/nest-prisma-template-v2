import { ApiKeyUtil } from "@lib/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { PrismaService } from "nestjs-prisma";
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
      async (apiKey: string, done: any) => {
        const apiKeyRecord = await this._prismaService.apiKey.findUnique({
          where: { key: ApiKeyUtil.encode(apiKey), isActive: true },
        });

        if (!apiKeyRecord) return done(new UnauthorizedException(), null);

        if (!apiKeyRecord.isActive) return done(new UnauthorizedException(), null);

        const currentDate = new Date();

        if (apiKeyRecord.expiresAt < currentDate) return done(new UnauthorizedException(), null);

        done(null, true);
      },
    );
  }
}
