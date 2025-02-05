import { JwtPayloadType, Role } from "@lib/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { PrismaService } from "nestjs-prisma";
import { ExtractJwt, Strategy } from "passport-jwt";
import { LoggedUser } from "../models/user.model";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly _configService: ConfigService,
    private readonly _prismaService: PrismaService,
  ) {
    const jwt = _configService.get("jwt");

    const extractJwt = (req: any) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies["access_token"];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      jwtFromRequest: extractJwt,
      secretOrKey: jwt.secret,
    });
  }

  async validate(payload: JwtPayloadType): Promise<LoggedUser> {
    const user = await this._prismaService.user.findUnique({
      where: { id: payload.sub },
      omit: { password: true },
      include: {
        Role2User: {
          where: {
            isActive: true,
          },
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    if (!user.isActive) throw new UnauthorizedException("User is not active");

    /**
     * if you want info on @LoggedUser add here
     */
    return {
      ...user,
      roles: user.Role2User.map(r2u => r2u.role.name) as Role[],
    };
  }
}
