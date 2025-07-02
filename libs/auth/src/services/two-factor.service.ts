import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  usedBackupCode?: string;
}

@Injectable()
export class TwoFactorService {
  private readonly appName: string;
  private readonly pendingVerifications = new Map<
    string,
    {
      secret: string;
      expiresAt: Date;
    }
  >();

  constructor(private readonly configService: ConfigService) {
    this.appName = this.configService.get("app.name") || "NestJS App";
  }

  /**
   * Generate a new 2FA secret for a user
   * Note: Install 'speakeasy' package for full TOTP functionality
   */
  generateSecret(userEmail: string): TwoFactorSecret {
    // Generate a base32 secret (32 characters)
    const secret = this.generateBase32Secret();
    const backupCodes = this.generateBackupCodes();
    const qrCode = this.generateQRCodeUrl(secret, userEmail);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify a 2FA token
   * Note: This is a simplified implementation. Use 'speakeasy' for production TOTP verification
   */
  verifyToken(secret: string, token: string, backupCodes?: string[]): TwoFactorVerification {
    // Simplified TOTP verification (replace with speakeasy.totp.verify in production)
    const isValidToken = this.verifyTOTP(secret, token);

    if (isValidToken) {
      return { isValid: true };
    }

    // If TOTP fails, try backup codes
    if (backupCodes && backupCodes.includes(token.toUpperCase())) {
      return {
        isValid: true,
        usedBackupCode: token.toUpperCase(),
      };
    }

    return { isValid: false };
  }

  /**
   * Generate backup codes for 2FA
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Start pending 2FA setup (before final verification)
   */
  startPendingSetup(userId: number, secret: string): string {
    const setupId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.pendingVerifications.set(setupId, {
      secret,
      expiresAt,
    });

    return setupId;
  }

  /**
   * Complete 2FA setup by verifying the initial token
   */
  completePendingSetup(setupId: string, token: string): { isValid: boolean; secret?: string } {
    const pending = this.pendingVerifications.get(setupId);

    if (!pending || pending.expiresAt < new Date()) {
      this.pendingVerifications.delete(setupId);
      return { isValid: false };
    }

    const verification = this.verifyToken(pending.secret, token);

    if (verification.isValid) {
      this.pendingVerifications.delete(setupId);
      return { isValid: true, secret: pending.secret };
    }

    return { isValid: false };
  }

  /**
   * Generate a QR code URL for 2FA setup
   */
  generateQRCodeUrl(secret: string, userEmail: string): string {
    const issuer = encodeURIComponent(this.appName);
    const label = encodeURIComponent(userEmail);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
  }

  /**
   * Clean up expired pending setups
   */
  cleanupExpiredSetups(): void {
    const now = new Date();

    for (const [setupId, setup] of this.pendingVerifications.entries()) {
      if (setup.expiresAt < now) {
        this.pendingVerifications.delete(setupId);
      }
    }
  }

  /**
   * Remove used backup code from the list
   */
  removeUsedBackupCode(backupCodes: string[], usedCode: string): string[] {
    return backupCodes.filter(code => code !== usedCode.toUpperCase());
  }

  /**
   * Validate backup code format
   */
  isValidBackupCodeFormat(code: string): boolean {
    return /^[A-F0-9]{8}$/.test(code.toUpperCase());
  }

  /**
   * Generate a base32 secret
   */
  private generateBase32Secret(): string {
    const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";

    for (let i = 0; i < 32; i++) {
      secret += base32Chars[Math.floor(Math.random() * base32Chars.length)];
    }

    return secret;
  }

  /**
   * Simplified TOTP verification (replace with speakeasy in production)
   */
  private verifyTOTP(secret: string, token: string): boolean {
    // This is a simplified implementation
    // In production, use speakeasy.totp.verify() for proper TOTP verification
    // For now, we'll just validate the token format
    return /^\d{6}$/.test(token);
  }
}
