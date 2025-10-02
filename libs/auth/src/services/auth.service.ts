import { PrismaService } from '@lib/prisma';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoggedUser } from '../models/user.model';
import { PasswordService } from './password.service';
import { RateLimitService } from './rate-limit.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorToken?: string;
  deviceInfo?: string;
}

export interface LoginResult {
  user: LoggedUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  requiresTwoFactor?: boolean;
  tempToken?: string; // For 2FA flow
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _passwordService: PasswordService,
    private readonly _tokenService: TokenService,
    private readonly _twoFactorService: TwoFactorService,
    private readonly _rateLimitService: RateLimitService,
  ) {}

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { email, password, twoFactorToken, deviceInfo } = credentials;

    // Rate limiting for login attempts
    const rateLimitConfig = this._rateLimitService.getDefaultConfigs().login;
    const rateLimitResult = this._rateLimitService.checkRateLimit(
      `login:${email}`,
      rateLimitConfig,
    );

    if (!rateLimitResult.allowed) {
      throw new UnauthorizedException(
        'Too many login attempts. Please try again later.',
      );
    }

    // Find user
    const user = await this._prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await this._passwordService.verifyPassword(
      password,
      user.password || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    // Note: Add twoFactorSecret and twoFactorBackupCodes fields to your User model for full 2FA support
    const hasTwoFactorSecret = false; // user.twoFactorSecret;

    if (hasTwoFactorSecret) {
      if (!twoFactorToken) {
        // Return temporary token for 2FA completion
        const tempToken = await this.generateTempToken(user.id);
        return {
          user: this.mapToLoggedUser(user),
          accessToken: '',
          refreshToken: '',
          accessTokenExpiresAt: new Date(),
          refreshTokenExpiresAt: new Date(),
          requiresTwoFactor: true,
          tempToken,
        };
      }

      // Verify 2FA token (placeholder - implement when 2FA fields are added)
      // const twoFactorVerification = this._twoFactorService.verifyToken(
      //   user.twoFactorSecret,
      //   twoFactorToken,
      //   user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : undefined,
      // );

      // if (!twoFactorVerification.isValid) {
      //   throw new UnauthorizedException('Invalid two-factor authentication code');
      // }
    }

    // Update last login
    await this._prismaService.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const loggedUser = this.mapToLoggedUser(user);
    const tokens = await this._tokenService.generateTokenPair(
      loggedUser,
      deviceInfo,
    );

    // Reset rate limit on successful login
    this._rateLimitService.resetRateLimit(`login:${email}`);

    return {
      user: loggedUser,
      ...tokens,
    };
  }

  /**
   * Register a new user
   */
  async register(
    data: RegisterData,
  ): Promise<{ user: LoggedUser; message: string }> {
    const { email, password } = data;

    // Check if user already exists
    const existingUser = await this._prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validate password
    const passwordValidation = this._passwordService.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet requirements',
        issues: passwordValidation.issues,
      });
    }

    // Hash password
    const hashedPassword = await this._passwordService.hashPassword(password);

    // Create user
    const user = await this._prismaService.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: false, // Require email verification
        // Add other fields as needed
      },
      include: { role: true },
    });

    return {
      user: this.mapToLoggedUser(user),
      message: 'User registered successfully. Please verify your email.',
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<Omit<LoginResult, 'user'> | null> {
    const userProvider = async (userId: number): Promise<LoggedUser | null> => {
      const user = await this._prismaService.user.findUnique({
        where: { id: userId, isActive: true },
        include: { role: true },
      });

      return user ? this.mapToLoggedUser(user) : null;
    };

    const tokens = await this._tokenService.refreshAccessToken(
      refreshToken,
      userProvider,
    );
    return tokens;
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await this._tokenService.revokeSession(sessionId);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: number): Promise<void> {
    await this._tokenService.revokeAllUserSessions(userId);
  }

  /**
   * Generate temporary token for 2FA flow
   */
  private async generateTempToken(userId: number): Promise<string> {
    // This should be a short-lived token for 2FA completion
    // Implementation depends on your requirements
    return `temp_${userId}_${Date.now()}`;
  }

  /**
   * Map database user to LoggedUser
   */
  private mapToLoggedUser(user: any): LoggedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role?.name,
      isActive: user.isActive,
      twoFactorEnabled: false, // !!user.twoFactorSecret - enable when field is added
      lastLoginAt: user.lastLogin,
    };
  }

  /**
   * Setup 2FA for a user
   */
  async setup2FA(userId: number): Promise<{
    setupId: string;
    qrCode: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  }> {
    const user = await this._prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate 2FA secret
    const secret = await this._twoFactorService.generateSecret(user.email);

    // Start pending setup
    const setupId = this._twoFactorService.startPendingSetup(
      userId,
      secret.secret,
    );

    return {
      setupId,
      qrCode: secret.qrCode,
      qrCodeDataUrl: secret.qrCodeDataUrl,
      backupCodes: secret.backupCodes,
    };
  }

  /**
   * Verify and complete 2FA setup
   */
  async verify2FASetup(
    setupId: string,
    token: string,
  ): Promise<{ success: boolean; backupCodes?: string[] }> {
    const result = this._twoFactorService.completePendingSetup(setupId, token);

    if (!result.isValid || !result.secret) {
      return { success: false };
    }

    // Note: In production, store the secret and backup codes in the database
    // Example:
    // await this._prismaService.user.update({
    //   where: { id: userId },
    //   data: {
    //     twoFactorSecret: result.secret,
    //     twoFactorBackupCodes: JSON.stringify(backupCodes),
    //     twoFactorEnabled: true,
    //   },
    // });

    const backupCodes = this._twoFactorService.generateBackupCodes();

    return {
      success: true,
      backupCodes,
    };
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(
    userId: number,
    _token: string,
  ): Promise<{ success: boolean }> {
    const user = await this._prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Note: Verify current 2FA token before disabling
    // const verification = this._twoFactorService.verifyToken(user.twoFactorSecret!, token);
    // if (!verification.isValid) {
    //   throw new UnauthorizedException('Invalid 2FA token');
    // }

    // Note: In production, clear 2FA data from database
    // await this._prismaService.user.update({
    //   where: { id: userId },
    //   data: {
    //     twoFactorSecret: null,
    //     twoFactorBackupCodes: null,
    //     twoFactorEnabled: false,
    //   },
    // });

    return { success: true };
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(
    userId: number,
    _token: string,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this._prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Note: Verify current 2FA token before generating new codes
    // const verification = this._twoFactorService.verifyToken(user.twoFactorSecret!, token);
    // if (!verification.isValid) {
    //   throw new UnauthorizedException('Invalid 2FA token');
    // }

    const backupCodes = this._twoFactorService.generateBackupCodes();

    // Note: In production, update backup codes in database
    // await this._prismaService.user.update({
    //   where: { id: userId },
    //   data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
    // });

    return { backupCodes };
  }
}
