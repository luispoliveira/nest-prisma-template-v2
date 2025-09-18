import { Role } from '@lib/common';

export class LoggedUser {
  id: number;
  email: string;
  role: Role;
  isActive?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorVerified?: boolean;
  lastLoginAt?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
}

export class AuthSession {
  sessionId: string;
  deviceInfo: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}
