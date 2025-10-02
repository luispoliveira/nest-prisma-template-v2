import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  qrCodeDataUrl: string;
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

  constructor(private readonly _configService: ConfigService) {
    this.appName = this._configService.get('app.name') || 'NestJS App';
  }

  /**
   * Generate a new 2FA secret for a user
   */
  async generateSecret(userEmail: string): Promise<TwoFactorSecret> {
    // Generate secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.appName,
      length: 32,
    });

    const backupCodes = this.generateBackupCodes();

    // Generate QR code data URL
    if (!secret.otpauth_url) {
      throw new Error('Failed to generate OTP auth URL');
    }
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Verify a 2FA token using speakeasy TOTP verification
   */
  verifyToken(
    secret: string,
    token: string,
    backupCodes?: string[],
  ): TwoFactorVerification {
    // First try to verify with TOTP using speakeasy
    const isValidToken = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow some time drift (±2 intervals)
    });

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
  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
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
  completePendingSetup(
    setupId: string,
    token: string,
  ): { isValid: boolean; secret?: string } {
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
   * Generate a QR code URL for 2FA setup using speakeasy
   */
  generateQRCodeUrl(secret: string, userEmail: string): string {
    return speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: this.appName,
      encoding: 'base32',
    });
  }

  /**
   * Generate QR code data URL from otpauth URL
   */
  async generateQRCodeDataUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
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
   * Generate a base32 secret using speakeasy
   */
  private generateBase32Secret(): string {
    // Use speakeasy to generate a proper base32 secret
    const secret = speakeasy.generateSecret({ length: 32 });
    return secret.base32;
  }

  /**
   * Generate current TOTP token for testing purposes
   */
  generateCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }

  /**
   * Verify if a secret is valid base32
   */
  isValidBase32Secret(secret: string): boolean {
    try {
      // Try to generate a token with the secret
      speakeasy.totp({ secret, encoding: 'base32' });
      return true;
    } catch {
      return false;
    }
  }
}
