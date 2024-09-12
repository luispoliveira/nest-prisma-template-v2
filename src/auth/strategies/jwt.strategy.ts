import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaService } from 'nestjs-prisma';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadType } from 'src/common/types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly _configService: ConfigService,
    private readonly _prismaService: PrismaService,
  ) {
    const jwt = _configService.get('jwt');

    const extractJwt = (req: any) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['access_token'];
      }
      return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    };

    super({
      jwtFromRequest: extractJwt,
      secretOrKey: jwt.secret,
    });
  }

  async validate(payload: JwtPayloadType) {
    const user = await this._prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) throw new UnauthorizedException();

    const { password, ...result } = user;
    return result;
  }
}
