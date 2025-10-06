import { ConfigUtil } from '@lib/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'node:crypto';
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
  decryptWebhookPayload(payload: string, iv: string, at: string): string {
    try {
      const key = Buffer.from(this.webhookSecret, 'base64');
      const ivBuffer = Buffer.from(iv, 'base64');
      const authTagBuffer = Buffer.from(at, 'base64');
      const cipherText = Buffer.from(payload, 'base64');

      const decipher = createDecipheriv('aes-256-gcm', key, ivBuffer);
      decipher.setAuthTag(authTagBuffer);

      const decrypted = Buffer.concat([
        decipher.update(cipherText),
        decipher.final(),
      ]);

      this.logger.debug('Webhook signature validated successfully');
      return decrypted.toString('utf-8');
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
    notificationID: string;
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
      notificationID: payload.notificationID,
    };
  }
}
