import { JwtPayloadType, PasswordUtil } from "@lib/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly _usersService: UsersService,
    private readonly _jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this._usersService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (!user.password) throw new UnauthorizedException("Invalid credentials");

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
