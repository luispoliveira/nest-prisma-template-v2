import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts in window
  blockDurationMs: number; // How long to block after exceeding limit
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: Date;
  blockedUntil?: Date;
}

@Injectable()
export class RateLimitService {
  private attempts = new Map<
    string,
    { count: number; windowStart: number; blockedUntil?: number }
  >();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if an action is rate limited
   */
  checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const key = identifier;
    const current = this.attempts.get(key);

    // Clean up expired entries periodically
    this.cleanupExpiredEntries(now);

    // Check if currently blocked
    if (current?.blockedUntil && current.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(current.blockedUntil),
        blockedUntil: new Date(current.blockedUntil),
      };
    }

    // Initialize or reset window
    if (!current || now - current.windowStart >= config.windowMs) {
      this.attempts.set(key, {
        count: 1,
        windowStart: now,
      });

      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetTime: new Date(now + config.windowMs),
      };
    }

    // Increment count
    current.count++;

    // Check if limit exceeded
    if (current.count > config.maxAttempts) {
      current.blockedUntil = now + config.blockDurationMs;

      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: new Date(current.windowStart + config.windowMs),
        blockedUntil: new Date(current.blockedUntil),
      };
    }

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - current.count,
      resetTime: new Date(current.windowStart + config.windowMs),
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get default rate limit configs for different scenarios
   */
  getDefaultConfigs() {
    return {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 5,
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
      },
      passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxAttempts: 3,
        blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours
      },
      apiKey: {
        windowMs: 60 * 1000, // 1 minute
        maxAttempts: 100,
        blockDurationMs: 5 * 60 * 1000, // 5 minutes
      },
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanupExpiredEntries(now: number): void {
    for (const [key, value] of this.attempts.entries()) {
      // Remove if window expired and not blocked
      if (
        now - value.windowStart >= 15 * 60 * 1000 && // Default cleanup window
        (!value.blockedUntil || value.blockedUntil <= now)
      ) {
        this.attempts.delete(key);
      }
    }
  }
}
