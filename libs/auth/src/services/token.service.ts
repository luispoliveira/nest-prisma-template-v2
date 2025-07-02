import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { LoggedUser } from "../models/user.model";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  sessionId: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;
  private readonly jwtSecret: string;

  // In-memory session store (replace with database in production)
  private readonly activeSessions = new Map<
    string,
    {
      userId: number;
      deviceInfo: string;
      createdAt: Date;
      expiresAt: Date;
    }
  >();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const jwtConfig = this.configService.get("jwt");
    this.accessTokenExpiresIn = jwtConfig?.accessTokenExpiresIn || "15m";
    this.refreshTokenExpiresIn = jwtConfig?.refreshTokenExpiresIn || "7d";
    this.jwtSecret = jwtConfig?.secret;
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(user: LoggedUser, deviceInfo?: string): Promise<TokenPair> {
    const sessionId = crypto.randomUUID();

    // Store session info in memory (replace with database storage)
    this.activeSessions.set(sessionId, {
      userId: user.id,
      deviceInfo: deviceInfo || "unknown",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.parseExpiration(this.refreshTokenExpiresIn)),
    });

    const payload: Omit<JwtPayload, "type" | "iat" | "exp"> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const accessToken = this.jwtService.sign(
      { ...payload, type: "access" },
      { expiresIn: this.accessTokenExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, type: "refresh" },
      { expiresIn: this.refreshTokenExpiresIn },
    );

    const accessTokenExpiresAt = new Date(
      Date.now() + this.parseExpiration(this.accessTokenExpiresIn),
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.parseExpiration(this.refreshTokenExpiresIn),
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    userProvider: (userId: number) => Promise<LoggedUser | null>,
  ): Promise<TokenPair | null> {
    try {
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Verify session is still active
      const session = this.activeSessions.get(payload.sessionId);
      if (!session || session.expiresAt < new Date()) {
        this.activeSessions.delete(payload.sessionId);
        return null;
      }

      // Get fresh user data
      const user = await userProvider(payload.sub);
      if (!user) {
        this.activeSessions.delete(payload.sessionId);
        return null;
      }

      // Generate new token pair
      return this.generateTokenPair(user, session.deviceInfo);
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke a session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: number): Promise<void> {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: number) {
    const userSessions = [];
    const now = new Date();

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.expiresAt > now) {
        userSessions.push({
          sessionId,
          deviceInfo: session.deviceInfo,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        });
      }
    }

    return userSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Verify token and extract payload
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.expiresAt <= now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Parse expiration string to milliseconds
   */
  private parseExpiration(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000; // Default 15 minutes
    }
  }
}
