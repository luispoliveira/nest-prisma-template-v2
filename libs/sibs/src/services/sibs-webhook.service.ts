import { ConfigUtil } from '@lib/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SibsValidationException } from '../exceptions/sibs.exception';
import { SibsWebhookPayload } from '../interfaces/sibs-api.interface';

@Injectable()
export class SibsWebhookService {
  private readonly logger = new Logger(SibsWebhookService.name);
  private readonly webhookSecret: string;

  constructor(private readonly _configService: ConfigService) {
    this.webhookSecret = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.webhookSecret',
    );
  }

  /**
   * Validates the webhook signature
   * @param payload The webhook payload
   * @param signature The signature from the webhook header
   * @returns true if valid, throws exception if invalid
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);

      // Use timingSafeEqual to prevent timing attacks
      const providedSignatureBuffer = Buffer.from(signature, 'hex');
      const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');

      if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
        throw new SibsValidationException('Invalid webhook signature length');
      }

      const isValid = crypto.timingSafeEqual(
        providedSignatureBuffer,
        expectedSignatureBuffer,
      );

      if (!isValid) {
        throw new SibsValidationException('Invalid webhook signature');
      }

      this.logger.debug('Webhook signature validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Webhook signature validation failed', { error });
      throw error;
    }
  }

  /**
   * Processes a validated webhook payload
   * @param payload The webhook payload
   * @returns Processed webhook data
   */
  processWebhook(payload: SibsWebhookPayload): {
    transactionId: string;
    merchantTransactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    amount: { value: number; currency: string };
    timestamp: string;
  } {
    this.logger.log('Processing SIBS webhook', {
      transactionId: payload.transactionID,
      merchantTransactionId: payload.merchantTransactionId,
      paymentStatus: payload.paymentStatus,
    });

    return {
      transactionId: payload.transactionID,
      merchantTransactionId: payload.merchantTransactionId,
      paymentStatus: payload.paymentStatus,
      paymentMethod: payload.paymentMethod,
      amount: payload.amount,
      timestamp: payload.timestamp,
    };
  }

  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');
  }
}
