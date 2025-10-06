import { ConfigUtil } from '@lib/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatusDto } from './dto/transaction-status.dto';
import {
  SibsTransactionNotFoundException,
  SibsValidationException,
} from './exceptions/sibs.exception';
import {
  SibsCheckoutRequest,
  SibsCheckoutResponse,
  SibsTransactionStatus,
  SibsWebhookPayload,
} from './interfaces/sibs-api.interface';
import { SibsHttpService } from './services/sibs-http.service';
import { SibsWebhookService } from './services/sibs-webhook.service';

@Injectable()
export class SibsService {
  private readonly logger = new Logger(SibsService.name);
  private readonly terminalId: string;
  private readonly entity: string;

  constructor(
    private readonly _configService: ConfigService,
    private readonly _sibsHttpService: SibsHttpService,
    private readonly _sibsWebhookService: SibsWebhookService,
  ) {
    this.terminalId = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.terminalId',
    );
    this.entity = ConfigUtil.getRequiredConfig(
      this._configService,
      'sibs.entity',
    );
  }

  /**
   * Creates a checkout session for payment processing
   * @param createTransactionDto Transaction details
   * @returns Checkout response with transaction ID and signature
   */
  async createCheckout(
    createTransactionDto: CreateTransactionDto,
  ): Promise<CreateCheckoutDto> {
    this.logger.log('Creating SIBS checkout', {
      merchantTransactionId: createTransactionDto.merchantTransactionId,
      amount: createTransactionDto.amount,
      paymentMethod: createTransactionDto.paymentMethod,
    });

    const checkoutRequest = this.buildCheckoutRequest(createTransactionDto);

    try {
      const response = await this._sibsHttpService.post<SibsCheckoutResponse>(
        '/payments',
        checkoutRequest,
      );

      this.logger.log('SIBS checkout created successfully', {
        transactionId: response.transactionID,
        merchantTransactionId: createTransactionDto.merchantTransactionId,
      });

      return {
        amount: response.amount,
        merchant: response.merchant,
        transactionID: response.transactionID,
        transactionSignature: response.transactionSignature,
        formContext: response.formContext,
        expiry: response.expiry,
        tokenList: response.tokenList,
        paymentMethodList: response.paymentMethodList,
        execution: response.execution,
        returnStatus: response.returnStatus,
      };
    } catch (error) {
      this.logger.error('Failed to create SIBS checkout', {
        error,
        merchantTransactionId: createTransactionDto.merchantTransactionId,
      });
      throw error;
    }
  }

  /**
   * Gets the status of a transaction
   * @param transactionId The SIBS transaction ID
   * @param transactionSignature The transaction signature from checkout
   * @returns Transaction status information
   */
  async getTransactionStatus(
    transactionId: string,
    transactionSignature?: string,
  ): Promise<TransactionStatusDto> {
    this.logger.log('Getting transaction status', { transactionId });

    try {
      const response = await this._sibsHttpService.get<SibsTransactionStatus>(
        `/payments/${transactionId}/status`,
        transactionSignature,
      );

      this.logger.log('Transaction status retrieved', {
        transactionId,
        paymentStatus: response.paymentStatus,
      });

      return {
        transactionID: response.transactionID,
        paymentStatus: response.paymentStatus,
        paymentMethod: response.paymentMethod,
        paymentReference: response.paymentReference,
        execution: response.execution,
        returnStatus: response.returnStatus,
      };
    } catch (error: any) {
      this.logger.error('Failed to get transaction status', {
        error,
        transactionId,
      });

      if (error.status === 404) {
        throw new SibsTransactionNotFoundException(transactionId);
      }

      throw error;
    }
  }

  /**
   * Generates a Multibanco reference for a transaction
   * @param transactionId The SIBS transaction ID
   * @param transactionSignature The transaction signature from checkout
   * @returns Transaction with Multibanco reference
   */
  async generateMultibancoReference(
    transactionId: string,
    transactionSignature: string,
  ): Promise<TransactionStatusDto> {
    this.logger.log('Generating Multibanco reference', { transactionId });

    try {
      const response = await this._sibsHttpService.post<SibsTransactionStatus>(
        `/payments/${transactionId}/service-reference/generate`,
        {},
        transactionSignature,
      );

      this.logger.log('Multibanco reference generated', {
        transactionId,
        paymentReference: response.paymentReference,
      });

      return {
        transactionID: response.transactionID,
        paymentStatus: response.paymentStatus,
        paymentMethod: response.paymentMethod,
        paymentReference: response.paymentReference,
        execution: response.execution,
        returnStatus: response.returnStatus,
      };
    } catch (error) {
      this.logger.error('Failed to generate Multibanco reference', {
        error,
        transactionId,
      });
      throw error;
    }
  }

  /**
   * Validates and processes a webhook from SIBS
   * @param payload Raw webhook payload
   * @param signature Webhook signature header
   * @returns Processed webhook data
   */
  processWebhook(
    payload: string,
    initializationVector: string,
    authenticationTag: string,
  ): {
    transactionId: string;
    merchantTransactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    amount: { value: number; currency: string };
    timestamp: string;
    notificationID: string;
  } {
    try {
      // Validate signature
      const decryptedPayload = this._sibsWebhookService.decryptWebhookPayload(
        payload,
        initializationVector,
        authenticationTag,
      );

      // Parse payload
      const webhookPayload: SibsWebhookPayload = JSON.parse(decryptedPayload);

      // Process webhook
      return this._sibsWebhookService.processWebhook(webhookPayload);
    } catch (error) {
      this.logger.error('Failed to process webhook', { error, payload });

      if (error instanceof SyntaxError) {
        throw new SibsValidationException('Invalid webhook payload format');
      }

      throw error;
    }
  }

  private buildCheckoutRequest(dto: CreateTransactionDto): SibsCheckoutRequest {
    const now = new Date().toISOString();

    const request: SibsCheckoutRequest = {
      merchant: {
        terminalId: this.terminalId,
        channel: dto.channel,
        merchantTransactionId: dto.merchantTransactionId,
      },
      transaction: {
        transactionTimestamp: now,
        description: dto.description,
        moto: dto.moto || false,
        paymentType: 'PURS',
        amount: dto.amount as any,
        paymentMethod: dto.paymentMethod,
      },
    };

    // Add customer info if provided (required for CARD payments)
    if (dto.customerInfo) {
      request.customer = {
        customerInfo: dto.customerInfo,
      };
    }

    // Add payment reference configuration if provided or if REFERENCE is in payment methods
    if (
      dto.paymentReference ||
      dto.paymentMethod.includes('REFERENCE' as any)
    ) {
      const referenceConfig = dto.paymentReference || {
        initialDatetime: now,
        finalDatetime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days from now
        maxAmount: dto.amount,
        minAmount: dto.amount,
        entity: this.entity,
      };

      request.transaction.paymentReference = referenceConfig as any;
    }

    return request;
  }
}
