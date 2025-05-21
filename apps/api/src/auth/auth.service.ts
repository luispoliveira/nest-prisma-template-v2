import { User } from "@gen/prisma-client";
import { JwtPayloadType, PasswordUtil } from "@lib/common";
import { PrismaService } from "@lib/prisma";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ENHANCED_PRISMA } from "@zenstackhq/server/nestjs";

@Injectable()
export class AuthService {
  constructor(
    @Inject(ENHANCED_PRISMA) private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this._prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) throw new UnauthorizedException("User not found");

    if (!user.password) throw new UnauthorizedException("User with no active credentials");

    if (!(await PasswordUtil.comparePassword(user.password, password)))
      throw new UnauthorizedException("Invalid credentials");

    /**
     * check if user is active
     */

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: User) {
    const payload: JwtPayloadType = {
      sub: user.id,
      email: user.email,
    };

    return {
      accessToken: await this._jwtService.signAsync(payload),
    };
  }
}
