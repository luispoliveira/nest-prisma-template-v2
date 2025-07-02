import { PrismaModule } from "@lib/prisma";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

// Services
import { AuthService } from "./services/auth.service";
import { PasswordService } from "./services/password.service";
import { RateLimitService } from "./services/rate-limit.service";
import { TokenService } from "./services/token.service";
import { TwoFactorService } from "./services/two-factor.service";

// Strategies
import { ApiKeyStrategy } from "./strategies/api-key.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

// Guards
import { ApiKeyAuthGuard } from "./guards/api-key-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { TwoFactorGuard } from "./guards/two-factor.guard";

// Other modules
import { AbacModule } from "./abac/abac.module";
import { RbacModule } from "./rbac/rbac.module";

// Controllers
import { TwoFactorController } from "./controllers/two-factor.controller";

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    RbacModule,
    AbacModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.get("jwt");
        return {
          secret: jwtConfig?.secret || "your-secret-key",
          signOptions: {
            expiresIn: jwtConfig?.accessTokenExpiresIn || "15m",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Services
    AuthService,
    PasswordService,
    TokenService,
    TwoFactorService,
    RateLimitService,

    // Strategies
    JwtStrategy,
    ApiKeyStrategy,

    // Guards
    JwtAuthGuard,
    ApiKeyAuthGuard,
    PermissionsGuard,
    TwoFactorGuard,
    RateLimitGuard,
  ],
  controllers: [TwoFactorController],
  exports: [
    // Services
    AuthService,
    PasswordService,
    TokenService,
    TwoFactorService,
    RateLimitService,

    // Guards
    JwtAuthGuard,
    ApiKeyAuthGuard,
    PermissionsGuard,
    TwoFactorGuard,
    RateLimitGuard,

    // Modules
    RbacModule,
    AbacModule,
  ],
})
export class AuthModule {}
