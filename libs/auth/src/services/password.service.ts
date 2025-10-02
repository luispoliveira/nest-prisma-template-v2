import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export interface PasswordValidationResult {
  isValid: boolean;
  issues: string[];
  strength: 'weak' | 'medium' | 'strong';
}

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  /**
   * Hash a password with bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength and requirements
   */
  validatePassword(password: string): PasswordValidationResult {
    const issues: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Uppercase letter check
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase letter check
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      issues.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common password check
    if (this.isCommonPassword(password)) {
      issues.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score <= 2) {
      strength = 'weak';
    } else if (score <= 4) {
      strength = 'medium';
    } else {
      strength = 'strong';
    }

    return {
      isValid: issues.length === 0,
      issues,
      strength,
    };
  }

  /**
   * Check if password is in common passwords list
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'shadow',
      'qwertyuiop',
      '123123',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';

    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
