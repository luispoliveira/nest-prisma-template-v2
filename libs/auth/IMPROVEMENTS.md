# Auth Library Improvements

## Overview

The enhanced### 3. Two-Factor Authentication

````typescript
import { TwoFactorService } from '@lib/auth';

// Generate 2FA secret with QR code
const secret = await twoFactorService.generateSecret('user@example.com');
console.log('QR Code URL:', secret.qrCode);
console.log('QR Code Data URL:', secret.qrCodeDataUrl); // Base64 image for display
console.log('Backup Codes:', secret.backupCodes);

// Verify 2FA token using speakeasy
const verification = twoFactorService.verifyToken(
  secret.secret,
  '123456', // User's TOTP code from authenticator app
  secret.backupCodes
);

// Generate current token for testing
const currentToken = twoFactorService.generateCurrentToken(secret.secret);

// Validate secret format
const isValid = twoFactorService.isValidBase32Secret(secret.secret);
``` includes comprehensive security features including:

- **Password Security**: Strong password validation and hashing
- **Rate Limiting**: Configurable rate limiting for different endpoints
- **Two-Factor Authentication**: TOTP and backup codes support
- **Enhanced JWT**: Refresh tokens and session management
- **Advanced Guards**: 2FA and rate limiting guards
- **Security Services**: Comprehensive authentication flow

## New Features

### 1. Password Service

```typescript
import { PasswordService } from "@lib/auth";

// Validate password strength
const validation = passwordService.validatePassword("mypassword");
if (!validation.isValid) {
  console.log("Issues:", validation.issues);
  console.log("Strength:", validation.strength);
}

// Hash and verify passwords
const hash = await passwordService.hashPassword("mypassword");
const isValid = await passwordService.verifyPassword("mypassword", hash);

// Generate secure passwords
const securePassword = passwordService.generateSecurePassword(16);
````

### 2. Rate Limiting

```typescript
import { RateLimit } from "@lib/auth";

@Controller("auth")
export class AuthController {
  @Post("login")
  @RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  })
  async login(@Body() loginDto: LoginDto) {
    // Login logic
  }
}
```

### 3. Two-Factor Authentication

```typescript
import { TwoFactorService } from "@lib/auth";

// Generate 2FA secret
const secret = twoFactorService.generateSecret("user@example.com");
console.log("QR Code URL:", secret.qrCode);
console.log("Backup Codes:", secret.backupCodes);

// Verify 2FA token
const verification = twoFactorService.verifyToken(
  secret.secret,
  "123456", // User's TOTP code
  secret.backupCodes,
);
```

### 4. Enhanced JWT with Session Management

```typescript
import { TokenService } from "@lib/auth";

// Generate token pair
const tokens = await tokenService.generateTokenPair(user, "Mobile App");

// Refresh tokens
const newTokens = await tokenService.refreshAccessToken(refreshToken, async userId =>
  getUserById(userId),
);

// Manage sessions
await tokenService.revokeSession(sessionId);
await tokenService.revokeAllUserSessions(userId);
```

### 5. Enhanced Guards

```typescript
import { Require2FA, RateLimit } from "@lib/auth";

@Controller("sensitive")
@UseGuards(JwtAuthGuard, TwoFactorGuard, RateLimitGuard)
export class SensitiveController {
  @Get("data")
  @Require2FA()
  @RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 10,
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
  })
  async getSensitiveData() {
    // Sensitive operation requiring 2FA
  }
}
```

### Complete 2FA Flow Example

```typescript
import { AuthService, TwoFactorService } from "@lib/auth";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post("2fa/setup")
  @UseGuards(JwtAuthGuard)
  async setup2FA(@CurrentUser() user: LoggedUser) {
    const setup = await this.authService.setup2FA(user.id);

    return {
      setupId: setup.setupId,
      qrCode: setup.qrCodeDataUrl, // Base64 image for frontend display
      backupCodes: setup.backupCodes,
      instructions:
        "Scan the QR code with your authenticator app and enter the 6-digit code to complete setup",
    };
  }

  @Post("2fa/verify-setup")
  @UseGuards(JwtAuthGuard)
  async verify2FASetup(@Body() { setupId, token }: { setupId: string; token: string }) {
    const result = await this.authService.verify2FASetup(setupId, token);

    if (!result.success) {
      throw new BadRequestException("Invalid 2FA token");
    }

    return {
      message: "2FA has been successfully enabled",
      backupCodes: result.backupCodes,
      warning:
        "Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.",
    };
  }

  @Post("2fa/disable")
  @UseGuards(JwtAuthGuard)
  async disable2FA(@CurrentUser() user: LoggedUser, @Body() { token }: { token: string }) {
    const result = await this.authService.disable2FA(user.id, token);

    return {
      message: "2FA has been disabled for your account",
    };
  }

  @Post("2fa/backup-codes/regenerate")
  @UseGuards(JwtAuthGuard)
  async regenerateBackupCodes(
    @CurrentUser() user: LoggedUser,
    @Body() { token }: { token: string },
  ) {
    const result = await this.authService.generateNewBackupCodes(user.id, token);

    return {
      backupCodes: result.backupCodes,
      message: "New backup codes generated. Previous codes are no longer valid.",
    };
  }
}
```

## Database Schema Updates Required

To fully utilize the new features, add these fields to your User model in `schema.prisma`:

```prisma
model User {
  // ... existing fields ...

  // Two-Factor Authentication
  twoFactorSecret       String?
  twoFactorBackupCodes  String? // JSON array of backup codes
  twoFactorEnabled      Boolean @default(false)

  // Security fields
  lastLoginAt          DateTime?
  loginAttempts        Int      @default(0)
  lockedUntil          DateTime?

  // Enhanced tracking
  lastPasswordChange   DateTime?
  passwordHistory      String?  // JSON array of previous password hashes
}

// Optional: Dedicated session management table
model UserSession {
  id           String   @id @default(cuid())
  userId       Int
  sessionId    String   @unique
  deviceInfo   String
  ipAddress    String?
  userAgent    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  lastAccessedAt DateTime @default(now())
  expiresAt    DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}
```

## Installation Dependencies

The enhanced auth library now uses proper 2FA implementation:

```bash
npm install speakeasy qrcode --legacy-peer-deps
npm install -D @types/speakeasy @types/qrcode --legacy-peer-deps
```

Note: Use `--legacy-peer-deps` if you encounter dependency resolution conflicts.

## Configuration

Update your configuration to include JWT settings:

```typescript
// config/configuration.ts
export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  app: {
    name: process.env.APP_NAME || "NestJS App",
  },
});
```

## Usage in Your App Module

```typescript
import { AuthModule } from "@lib/auth";

@Module({
  imports: [
    // ... other imports
    AuthModule,
  ],
})
export class AppModule {}
```

## Security Best Practices Implemented

1. **Password Security**: Strong validation, bcrypt hashing with salt rounds
2. **Rate Limiting**: Prevents brute force attacks
3. **Session Management**: Proper token lifecycle management
4. **Two-Factor Authentication**: Additional security layer
5. **Input Validation**: Comprehensive input validation
6. **Secure Headers**: Rate limit headers for client awareness
7. **Memory Management**: Cleanup of expired sessions and rate limit data

## Migration Guide

1. **Update Dependencies**: Install new packages if using 2FA
2. **Database Migration**: Add new fields to User model
3. **Update Imports**: Use new exports from enhanced auth library
4. **Configuration**: Add JWT and app configuration
5. **Guards**: Update controller guards to use new features
6. **Testing**: Test new rate limiting and security features

## Performance Considerations

- Rate limiting uses in-memory storage (replace with Redis for production)
- Session management uses in-memory storage (implement database storage)
- Regular cleanup of expired data prevents memory leaks
- Configurable token expiration times for balance between security and UX

## Future Enhancements

- Redis integration for distributed rate limiting
- Database session storage
- Audit logging integration
- WebAuthn support
- Social authentication providers
- Advanced threat detection
