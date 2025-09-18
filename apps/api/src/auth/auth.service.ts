import { User } from '@gen/prisma-client';
import { JwtPayloadType, PasswordUtil, TokenUtil } from '@lib/common';
import { PrismaService } from '@lib/prisma';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @Inject() private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this._prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.isActive) throw new UnauthorizedException('User is not active');

    if (!user.password)
      throw new UnauthorizedException('User with no active credentials');

    if (!(await PasswordUtil.comparePassword(user.password, password)))
      throw new UnauthorizedException('Invalid credentials');

    /**
     * check if user is active
     */

    const { password: _, ...result } = user;
    return result;
  }

  async signUp(email: string, password: string) {
    const hashedPassword = await PasswordUtil.hashPassword(password);
    const user = await this._prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        isActive: false,
        createdBy: email,
        updatedBy: email,
      },
    });

    /**
     * send email
     */

    return user;
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

  async forgetPassword(email: string) {
    const user = await this._prismaService.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const token = TokenUtil.generate();

    await this._prismaService.user.update({
      where: {
        email,
      },
      data: {
        isActive: false,
        password: null,
        resetPasswordToken: token,
        resetPasswordTokenExpiresAt: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000,
        ),
      },
    });

    /**
     * send email
     */

    return user;
  }

  async resetPassword(token: string, password: string) {
    const user = await this._prismaService.user.findUnique({
      where: {
        resetPasswordToken: token,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.resetPasswordTokenExpiresAt)
      throw new UnauthorizedException('Token expired');

    if (user.resetPasswordTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    const hashedPassword = await PasswordUtil.hashPassword(password);

    await this._prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
        isActive: true,
      },
    });

    return user;
  }
}
