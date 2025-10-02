import { ApiKeyStrategy } from '@lib/auth';
import { JwtStrategy } from '@lib/auth/strategies/jwt.strategy';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        const jwt = config.get<{
          secret: string;
          expiresIn: string;
        }>('jwt');

        if (!jwt) {
          throw new Error('JWT configuration is not defined');
        }

        return {
          global: true,
          secret: jwt.secret,
          signOptions: {
            expiresIn: jwt.expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, ApiKeyStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
