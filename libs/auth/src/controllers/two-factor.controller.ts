import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { Require2FA } from '../decorators/require-2fa.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorGuard } from '../guards/two-factor.guard';
import { LoggedUser } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { TwoFactorService } from '../services/two-factor.service';

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TwoFactorController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post('setup')
  @ApiOperation({ summary: 'Setup 2FA for the current user' })
  @ApiResponse({ status: 200, description: '2FA setup initiated' })
  @RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 3,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  })
  async setup2FA(@CurrentUser() user: LoggedUser) {
    const setup = await this.authService.setup2FA(user.id);

    return {
      setupId: setup.setupId,
      qrCodeDataUrl: setup.qrCodeDataUrl,
      manualEntryKey: setup.qrCode.split('secret=')[1]?.split('&')[0], // Extract secret for manual entry
      backupCodes: setup.backupCodes,
      instructions: [
        '1. Install an authenticator app (Google Authenticator, Authy, etc.)',
        '2. Scan the QR code or manually enter the key',
        '3. Enter the 6-digit code from your app to complete setup',
      ],
    };
  }

  @Post('verify-setup')
  @ApiOperation({ summary: 'Verify and complete 2FA setup' })
  @ApiResponse({ status: 200, description: '2FA setup completed successfully' })
  @RateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 5,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  })
  async verifySetup(@Body() body: { setupId: string; token: string }) {
    const result = await this.authService.verify2FASetup(
      body.setupId,
      body.token,
    );

    if (!result.success) {
      return {
        success: false,
        message: 'Invalid 2FA token. Please try again.',
      };
    }

    return {
      success: true,
      message: '2FA has been successfully enabled for your account',
      backupCodes: result.backupCodes,
      warning:
        'Save these backup codes in a secure location. They can be used to access your account if you lose your authenticator device.',
    };
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable 2FA for the current user' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @UseGuards(TwoFactorGuard) // Require 2FA to disable 2FA
  @Require2FA()
  async disable2FA(
    @CurrentUser() user: LoggedUser,
    @Body() body: { token: string },
  ) {
    const result = await this.authService.disable2FA(user.id, body.token);

    return {
      message: '2FA has been disabled for your account',
      warning:
        'Your account security has been reduced. Consider re-enabling 2FA.',
    };
  }

  @Post('backup-codes/regenerate')
  @ApiOperation({ summary: 'Generate new backup codes' })
  @ApiResponse({ status: 200, description: 'New backup codes generated' })
  @UseGuards(TwoFactorGuard)
  @Require2FA()
  async regenerateBackupCodes(
    @CurrentUser() user: LoggedUser,
    @Body() body: { token: string },
  ) {
    const result = await this.authService.generateNewBackupCodes(
      user.id,
      body.token,
    );

    return {
      backupCodes: result.backupCodes,
      message: 'New backup codes generated successfully',
      warning: 'Previous backup codes are no longer valid',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get 2FA status for current user' })
  @ApiResponse({ status: 200, description: '2FA status retrieved' })
  async get2FAStatus(@CurrentUser() user: LoggedUser) {
    // Note: This would check user's 2FA status from database
    return {
      enabled: user.twoFactorEnabled || false,
      lastSetup: null, // Would come from database
      backupCodesRemaining: 0, // Would count from database
    };
  }

  @Post('test-token')
  @ApiOperation({ summary: 'Test a 2FA token (development only)' })
  @ApiResponse({ status: 200, description: 'Token test result' })
  async testToken(@Body() body: { secret: string; token: string }) {
    // This endpoint should only be available in development
    if (process.env.NODE_ENV === 'production') {
      return { message: 'Not available in production' };
    }

    const verification = this.twoFactorService.verifyToken(
      body.secret,
      body.token,
    );

    return {
      valid: verification.isValid,
      usedBackupCode: verification.usedBackupCode,
      currentToken: this.twoFactorService.generateCurrentToken(body.secret),
    };
  }
}
