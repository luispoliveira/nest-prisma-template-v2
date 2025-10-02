import { ContextUtil } from '@lib/common';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_2FA_KEY } from '../decorators/require-2fa.decorator';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(private readonly _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const require2FA = this._reflector.getAllAndOverride<boolean>(
      REQUIRE_2FA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!require2FA) {
      return true;
    }

    const request = ContextUtil.getRequest(context);
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has 2FA enabled and verified
    // Note: You'll need to add these fields to your user model
    if (!user.twoFactorEnabled) {
      throw new ForbiddenException(
        'Two-factor authentication is required for this action',
      );
    }

    if (!user.twoFactorVerified) {
      throw new ForbiddenException(
        'Two-factor authentication verification required',
      );
    }

    return true;
  }
}
