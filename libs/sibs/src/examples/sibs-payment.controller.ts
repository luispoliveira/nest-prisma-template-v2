import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import {
  ChannelEnum,
  CreateTransactionDto,
  PaymentMethodEnum,
} from '../dto/create-transaction.dto';
import { TransactionStatusDto } from '../dto/transaction-status.dto';
import {
  SibsException,
  SibsTransactionNotFoundException,
  SibsValidationException,
} from '../exceptions/sibs.exception';
import { SibsService } from '../sibs.service';

@ApiTags('SIBS Payments')
@Controller('payments/sibs')
@ApiBearerAuth()
export class SibsPaymentController {
  private readonly logger = new Logger(SibsPaymentController.name);

  constructor(private readonly _sibsService: SibsService) {}

  @Post('checkout')
  @ApiOperation({
    summary: 'Create SIBS payment checkout',
    description: 'Creates a new payment transaction with SIBS Gateway',
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout created successfully',
    type: CreateCheckoutDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 500,
    description: 'SIBS API error',
  })
  async createCheckout(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<CreateCheckoutDto> {
    try {
      this.logger.log('Creating SIBS checkout', {
        merchantTransactionId: createTransactionDto.merchantTransactionId,
        amount: createTransactionDto.amount,
      });

      const checkout =
        await this._sibsService.createCheckout(createTransactionDto);

      this.logger.log('SIBS checkout created', {
        transactionId: checkout.transactionID,
        paymentMethods: checkout.paymentMethodList,
      });

      return checkout;
    } catch (error) {
      this.logger.error('Failed to create checkout', { error });

      if (error instanceof SibsException) {
        throw error;
      }

      throw new BadRequestException('Failed to create payment checkout');
    }
  }

  @Get(':transactionId/status')
  @ApiOperation({
    summary: 'Get transaction status',
    description: 'Retrieves the current status of a SIBS transaction',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'SIBS transaction ID',
    example: 's2CB2CH3U91PdGDHsacJ',
  })
  @ApiQuery({
    name: 'signature',
    description: 'Transaction signature from checkout (optional)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction status retrieved',
    type: TransactionStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getTransactionStatus(
    @Param('transactionId') transactionId: string,
    @Query('signature') transactionSignature?: string,
  ): Promise<TransactionStatusDto> {
    try {
      this.logger.log('Getting transaction status', { transactionId });

      const status = await this._sibsService.getTransactionStatus(
        transactionId,
        transactionSignature,
      );

      this.logger.log('Transaction status retrieved', {
        transactionId,
        paymentStatus: status.paymentStatus,
      });

      return status;
    } catch (error) {
      this.logger.error('Failed to get transaction status', {
        error,
        transactionId,
      });

      if (error instanceof SibsTransactionNotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to get transaction status');
    }
  }

  @Post(':transactionId/multibanco')
  @ApiOperation({
    summary: 'Generate Multibanco reference',
    description: 'Generates a Multibanco payment reference for the transaction',
  })
  @ApiParam({
    name: 'transactionId',
    description: 'SIBS transaction ID',
    example: 's2CB2CH3U91PdGDHsacJ',
  })
  @ApiQuery({
    name: 'signature',
    description: 'Transaction signature from checkout (required)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Multibanco reference generated',
    type: TransactionStatusDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction or signature',
  })
  async generateMultibancoReference(
    @Param('transactionId') transactionId: string,
    @Query('signature') transactionSignature: string,
  ): Promise<TransactionStatusDto> {
    if (!transactionSignature) {
      throw new BadRequestException('Transaction signature is required');
    }

    try {
      this.logger.log('Generating Multibanco reference', { transactionId });

      const result = await this._sibsService.generateMultibancoReference(
        transactionId,
        transactionSignature,
      );

      this.logger.log('Multibanco reference generated', {
        transactionId,
        paymentReference: result.paymentReference,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to generate Multibanco reference', {
        error,
        transactionId,
      });

      if (error instanceof SibsException) {
        throw error;
      }

      throw new BadRequestException('Failed to generate Multibanco reference');
    }
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Process SIBS webhook',
    description: 'Handles payment status notifications from SIBS Gateway',
  })
  @ApiHeader({
    name: 'x-sibs-signature',
    description: 'Webhook signature for validation',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        transactionId: { type: 'string' },
        paymentStatus: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature or payload',
  })
  async handleWebhook(
    @Body() rawPayload: any,
    @Headers('x-sibs-signature') signature: string,
  ): Promise<{
    success: boolean;
    transactionId: string;
    paymentStatus: string;
  }> {
    if (!signature) {
      throw new BadRequestException('Webhook signature is required');
    }

    try {
      this.logger.log('Processing SIBS webhook', { signature });

      const webhookData = this._sibsService.processWebhook(
        JSON.stringify(rawPayload),
        signature,
      );

      this.logger.log('Webhook processed successfully', {
        transactionId: webhookData.transactionId,
        paymentStatus: webhookData.paymentStatus,
      });

      // Here you would typically update your database with the payment status
      await this.handlePaymentUpdate(webhookData);

      return {
        success: true,
        transactionId: webhookData.transactionId,
        paymentStatus: webhookData.paymentStatus,
      };
    } catch (error) {
      this.logger.error('Failed to process webhook', { error });

      if (error instanceof SibsValidationException) {
        throw error;
      }

      throw new BadRequestException('Failed to process webhook');
    }
  }

  // Example endpoint to create a quick payment with common defaults
  @Post('quick-payment')
  @ApiOperation({
    summary: 'Create quick payment',
    description: 'Creates a payment with common defaults for quick testing',
  })
  @ApiResponse({
    status: 201,
    description: 'Quick payment created successfully',
    type: CreateCheckoutDto,
  })
  async createQuickPayment(
    @Body()
    body: {
      amount: number;
      description: string;
      merchantTransactionId: string;
      customerEmail?: string;
    },
  ): Promise<CreateCheckoutDto> {
    const createTransactionDto: CreateTransactionDto = {
      description: body.description,
      amount: {
        value: body.amount,
        currency: 'EUR',
      },
      paymentMethod: [PaymentMethodEnum._REFERENCE, PaymentMethodEnum._MBWAY],
      channel: ChannelEnum._WEB,
      merchantTransactionId: body.merchantTransactionId,
    };

    // Add customer info if email provided
    if (body.customerEmail) {
      createTransactionDto.customerInfo = {
        customerEmail: body.customerEmail,
        shippingAddress: {
          street1: 'Rua Exemplo, 123',
          city: 'Lisboa',
          postcode: '1200-100',
          country: 'PT',
        },
        billingAddress: {
          street1: 'Rua Exemplo, 123',
          city: 'Lisboa',
          postcode: '1200-100',
          country: 'PT',
        },
      };
    }

    return this.createCheckout(createTransactionDto);
  }

  private async handlePaymentUpdate(webhookData: {
    transactionId: string;
    merchantTransactionId: string;
    paymentStatus: string;
    paymentMethod?: string;
    amount: { value: number; currency: string };
    timestamp: string;
  }): Promise<void> {
    // This is where you would implement your business logic
    // For example:
    // 1. Update payment status in database
    // 2. Send confirmation emails
    // 3. Update order status
    // 4. Trigger fulfillment processes
    // 5. Log payment events for audit

    this.logger.log('Payment update processed', {
      transactionId: webhookData.transactionId,
      merchantTransactionId: webhookData.merchantTransactionId,
      paymentStatus: webhookData.paymentStatus,
      amount: webhookData.amount,
    });

    // Example implementation:
    /*
    switch (webhookData.paymentStatus) {
      case 'Success':
        await this.orderService.markAsPaid(webhookData.merchantTransactionId);
        await this.emailService.sendPaymentConfirmation(webhookData);
        break;
      case 'Failed':
      case 'Cancelled':
        await this.orderService.markAsFailed(webhookData.merchantTransactionId);
        break;
      case 'Timeout':
        await this.orderService.markAsExpired(webhookData.merchantTransactionId);
        break;
    }
    */
  }
}
