import * as crypto from 'crypto';

export class SecurityUtil {
  /**
   * Generate a cryptographically secure random string
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure API key with optional prefix
   */
  static generateApiKey(prefix?: string): string {
    const token = this.generateSecureToken(32);
    return prefix ? `${prefix}_${token}` : token;
  }

  /**
   * Hash a sensitive value using SHA-256
   */
  static hashValue(value: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    hash.update(value + actualSalt);
    return hash.digest('hex');
  }

  /**
   * Generate a secure one-time password (OTP)
   */
  static generateOTP(length = 6): string {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }

    return otp;
  }

  /**
   * Generate a time-based OTP that expires after specified minutes
   */
  static generateTimeBasedOTP(
    length = 6,
    expiryMinutes = 5,
  ): {
    otp: string;
    expiresAt: Date;
    hash: string;
  } {
    const otp = this.generateOTP(length);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const hash = this.hashValue(otp);

    return { otp, expiresAt, hash };
  }

  /**
   * Verify a time-based OTP
   */
  static verifyTimeBasedOTP(
    inputOtp: string,
    storedHash: string,
    expiresAt: Date,
  ): boolean {
    // Check if OTP has expired
    if (new Date() > expiresAt) {
      return false;
    }

    // Verify the OTP hash
    const inputHash = this.hashValue(inputOtp);
    return inputHash === storedHash;
  }

  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and > characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate if a string is a valid UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create a HMAC signature for data integrity
   */
  static createHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * Generate a secure temporary password
   */
  static generateTemporaryPassword(length = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each set
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => crypto.randomInt(-1, 2))
      .join('');
  }

  /**
   * Rate limiting helper - check if action is allowed
   */
  static isRateLimited(
    lastAttempt: Date,
    maxAttempts: number,
    currentAttempts: number,
    windowMinutes = 15,
  ): { allowed: boolean; resetTime?: Date } {
    const now = new Date();
    const windowMs = windowMinutes * 60 * 1000;
    const resetTime = new Date(lastAttempt.getTime() + windowMs);

    // If window has passed, reset attempts
    if (now >= resetTime) {
      return { allowed: true };
    }

    // Check if under limit
    if (currentAttempts < maxAttempts) {
      return { allowed: true };
    }

    return { allowed: false, resetTime };
  }
}
