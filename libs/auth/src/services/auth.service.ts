import { PrismaService } from "@lib/prisma";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { LoggedUser } from "../models/user.model";
import { PasswordService } from "./password.service";
import { RateLimitService } from "./rate-limit.service";
import { TokenService } from "./token.service";
import { TwoFactorService } from "./two-factor.service";

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
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { email, password, twoFactorToken, deviceInfo } = credentials;

    // Rate limiting for login attempts
    const rateLimitConfig = this.rateLimitService.getDefaultConfigs().login;
    const rateLimitResult = this.rateLimitService.checkRateLimit(`login:${email}`, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      throw new UnauthorizedException("Too many login attempts. Please try again later.");
    }

    // Find user
    const user = await this.prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is not active");
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      password,
      user.password || "",
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
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
          accessToken: "",
          refreshToken: "",
          accessTokenExpiresAt: new Date(),
          refreshTokenExpiresAt: new Date(),
          requiresTwoFactor: true,
          tempToken,
        };
      }

      // Verify 2FA token (placeholder - implement when 2FA fields are added)
      // const twoFactorVerification = this.twoFactorService.verifyToken(
      //   user.twoFactorSecret,
      //   twoFactorToken,
      //   user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : undefined,
      // );

      // if (!twoFactorVerification.isValid) {
      //   throw new UnauthorizedException('Invalid two-factor authentication code');
      // }
    }

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const loggedUser = this.mapToLoggedUser(user);
    const tokens = await this.tokenService.generateTokenPair(loggedUser, deviceInfo);

    // Reset rate limit on successful login
    this.rateLimitService.resetRateLimit(`login:${email}`);

    return {
      user: loggedUser,
      ...tokens,
    };
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: LoggedUser; message: string }> {
    const { email, password } = data;

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    // Validate password
    const passwordValidation = this.passwordService.validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        message: "Password does not meet requirements",
        issues: passwordValidation.issues,
      });
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const user = await this.prismaService.user.create({
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
      message: "User registered successfully. Please verify your email.",
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<Omit<LoginResult, "user"> | null> {
    const userProvider = async (userId: number): Promise<LoggedUser | null> => {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId, isActive: true },
        include: { role: true },
      });

      return user ? this.mapToLoggedUser(user) : null;
    };

    const tokens = await this.tokenService.refreshAccessToken(refreshToken, userProvider);
    return tokens;
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await this.tokenService.revokeSession(sessionId);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: number): Promise<void> {
    await this.tokenService.revokeAllUserSessions(userId);
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
}
