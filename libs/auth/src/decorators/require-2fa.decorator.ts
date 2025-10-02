import { SetMetadata } from '@nestjs/common';

export const REQUIRE_2FA_KEY = 'require2fa';

/**
 * Decorator to require 2FA for specific endpoints
 */
export const Require2FA = () => SetMetadata(REQUIRE_2FA_KEY, true);
