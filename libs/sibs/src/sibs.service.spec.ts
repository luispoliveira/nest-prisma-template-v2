import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ChannelEnum,
  CreateTransactionDto,
  PaymentMethodEnum,
} from './dto/create-transaction.dto';
import {
  SibsTransactionNotFoundException,
  SibsValidationException,
} from './exceptions/sibs.exception';
import {
  SibsCheckoutResponse,
  SibsTransactionStatus,
  SibsWebhookPayload,
} from './interfaces/sibs-api.interface';
import { SibsHttpService } from './services/sibs-http.service';
import { SibsWebhookService } from './services/sibs-webhook.service';
import { SibsService } from './sibs.service';

describe('SibsService', () => {
  let service: SibsService;
  let httpService: SibsHttpService;
  let webhookService: SibsWebhookService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'sibs.terminalId': 'TEST_TERMINAL_ID',
        'sibs.entity': '12345',
      };
      return config[key];
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockWebhookService = {
    decryptWebhookPayload: jest.fn(),
    processWebhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SibsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SibsHttpService,
          useValue: mockHttpService,
        },
        {
          provide: SibsWebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    service = module.get<SibsService>(SibsService);
    httpService = module.get<SibsHttpService>(SibsHttpService);
    webhookService = module.get<SibsWebhookService>(SibsWebhookService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckout', () => {
    const createTransactionDto: CreateTransactionDto = {
      merchantTransactionId: 'TXN_123456',
      amount: {
        value: 10000,
        currency: 'EUR',
      },
      description: 'Test payment',
      channel: ChannelEnum._WEB,
      paymentMethod: [PaymentMethodEnum._CARD],
      moto: false,
      customerInfo: {
        customerEmail: 'test@example.com',
        shippingAddress: {
          street1: 'Test Street 1',
          city: 'Lisbon',
          postcode: '1000-001',
          country: 'PT',
        },
        billingAddress: {
          street1: 'Test Street 1',
          city: 'Lisbon',
          postcode: '1000-001',
          country: 'PT',
        },
      },
    };

    const mockCheckoutResponse: SibsCheckoutResponse = {
      amount: {
        value: 10000,
        currency: 'EUR',
      },
      merchant: {
        terminalId: 'TEST_TERMINAL_ID',
        merchantTransactionId: 'TXN_123456',
      },
      transactionID: 'SIBS_TXN_123',
      transactionSignature: 'signature_abc123',
      formContext: 'FORM_CONTEXT_ABC',
      expiry: '2025-10-06T12:00:00Z',
      tokenList: [],
      paymentMethodList: ['CARD'],
      execution: {
        startTime: '2025-10-06T10:00:00Z',
        endTime: '2025-10-06T10:00:01Z',
      },
      returnStatus: {
        statusCode: '000',
        statusMsg: 'Success',
        statusDescription: 'Transaction created successfully',
      },
    };

    it('should create a checkout successfully', async () => {
      mockHttpService.post.mockResolvedValue(mockCheckoutResponse);

      const result = await service.createCheckout(createTransactionDto);

      expect(result).toEqual({
        amount: mockCheckoutResponse.amount,
        merchant: mockCheckoutResponse.merchant,
        transactionID: mockCheckoutResponse.transactionID,
        transactionSignature: mockCheckoutResponse.transactionSignature,
        formContext: mockCheckoutResponse.formContext,
        expiry: mockCheckoutResponse.expiry,
        tokenList: mockCheckoutResponse.tokenList,
        paymentMethodList: mockCheckoutResponse.paymentMethodList,
        execution: mockCheckoutResponse.execution,
        returnStatus: mockCheckoutResponse.returnStatus,
      });

      expect(httpService.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          merchant: expect.objectContaining({
            terminalId: 'TEST_TERMINAL_ID',
            merchantTransactionId: 'TXN_123456',
            channel: 'web',
          }),
          transaction: expect.objectContaining({
            description: 'Test payment',
            paymentType: 'PURS',
            amount: createTransactionDto.amount,
            paymentMethod: ['CARD'],
            moto: false,
          }),
        }),
      );
    });

    it('should include customer info when provided', async () => {
      mockHttpService.post.mockResolvedValue(mockCheckoutResponse);

      await service.createCheckout(createTransactionDto);

      expect(httpService.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          customer: {
            customerInfo: createTransactionDto.customerInfo,
          },
        }),
      );
    });

    it('should add payment reference for REFERENCE payment method', async () => {
      const dtoWithReference: CreateTransactionDto = {
        ...createTransactionDto,
        paymentMethod: [PaymentMethodEnum._REFERENCE],
      };

      mockHttpService.post.mockResolvedValue(mockCheckoutResponse);

      await service.createCheckout(dtoWithReference);

      expect(httpService.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          transaction: expect.objectContaining({
            paymentReference: expect.objectContaining({
              entity: '12345',
              maxAmount: dtoWithReference.amount,
              minAmount: dtoWithReference.amount,
            }),
          }),
        }),
      );
    });

    it('should use custom payment reference if provided', async () => {
      const customPaymentReference = {
        initialDatetime: '2025-10-06T00:00:00Z',
        finalDatetime: '2025-10-13T00:00:00Z',
        maxAmount: { value: 10000, currency: 'EUR' as const },
        minAmount: { value: 5000, currency: 'EUR' as const },
        entity: '99999',
      };

      const dtoWithCustomReference: CreateTransactionDto = {
        ...createTransactionDto,
        paymentReference: customPaymentReference,
      };

      mockHttpService.post.mockResolvedValue(mockCheckoutResponse);

      await service.createCheckout(dtoWithCustomReference);

      expect(httpService.post).toHaveBeenCalledWith(
        '/payments',
        expect.objectContaining({
          transaction: expect.objectContaining({
            paymentReference: customPaymentReference,
          }),
        }),
      );
    });

    it('should throw error when checkout creation fails', async () => {
      const error = new Error('Network error');
      mockHttpService.post.mockRejectedValue(error);

      await expect(
        service.createCheckout(createTransactionDto),
      ).rejects.toThrow(error);
    });
  });

  describe('getTransactionStatus', () => {
    const transactionId = 'SIBS_TXN_123';
    const transactionSignature = 'signature_abc123';

    const mockTransactionStatus: SibsTransactionStatus = {
      transactionID: transactionId,
      paymentStatus: 'Success',
      paymentMethod: 'CARD',
      execution: {
        startTime: '2025-10-06T10:00:00Z',
        endTime: '2025-10-06T10:00:01Z',
      },
      returnStatus: {
        statusCode: '000',
        statusMsg: 'Success',
        statusDescription: 'Transaction completed successfully',
      },
    };

    it('should get transaction status successfully', async () => {
      mockHttpService.get.mockResolvedValue(mockTransactionStatus);

      const result = await service.getTransactionStatus(
        transactionId,
        transactionSignature,
      );

      expect(result).toEqual({
        transactionID: mockTransactionStatus.transactionID,
        paymentStatus: mockTransactionStatus.paymentStatus,
        paymentMethod: mockTransactionStatus.paymentMethod,
        paymentReference: mockTransactionStatus.paymentReference,
        execution: mockTransactionStatus.execution,
        returnStatus: mockTransactionStatus.returnStatus,
      });

      expect(httpService.get).toHaveBeenCalledWith(
        `/payments/${transactionId}/status`,
        transactionSignature,
      );
    });

    it('should get transaction status without signature', async () => {
      mockHttpService.get.mockResolvedValue(mockTransactionStatus);

      await service.getTransactionStatus(transactionId);

      expect(httpService.get).toHaveBeenCalledWith(
        `/payments/${transactionId}/status`,
        undefined,
      );
    });

    it('should throw SibsTransactionNotFoundException when transaction not found', async () => {
      const notFoundError = { status: 404 };
      mockHttpService.get.mockRejectedValue(notFoundError);

      await expect(
        service.getTransactionStatus(transactionId, transactionSignature),
      ).rejects.toThrow(SibsTransactionNotFoundException);
    });

    it('should throw original error when not 404', async () => {
      const error = new Error('Server error');
      mockHttpService.get.mockRejectedValue(error);

      await expect(
        service.getTransactionStatus(transactionId, transactionSignature),
      ).rejects.toThrow(error);
    });
  });

  describe('generateMultibancoReference', () => {
    const transactionId = 'SIBS_TXN_123';
    const transactionSignature = 'signature_abc123';

    const mockTransactionStatus: SibsTransactionStatus = {
      transactionID: transactionId,
      paymentStatus: 'Processing',
      paymentMethod: 'REFERENCE',
      paymentReference: {
        entity: '12345',
        reference: '123456789',
        amount: {
          value: 10000,
          currency: 'EUR',
        },
      },
      execution: {
        startTime: '2025-10-06T10:00:00Z',
        endTime: '2025-10-06T10:00:01Z',
      },
      returnStatus: {
        statusCode: '000',
        statusMsg: 'Success',
        statusDescription: 'Reference generated successfully',
      },
    };

    it('should generate Multibanco reference successfully', async () => {
      mockHttpService.post.mockResolvedValue(mockTransactionStatus);

      const result = await service.generateMultibancoReference(
        transactionId,
        transactionSignature,
      );

      expect(result).toEqual({
        transactionID: mockTransactionStatus.transactionID,
        paymentStatus: mockTransactionStatus.paymentStatus,
        paymentMethod: mockTransactionStatus.paymentMethod,
        paymentReference: mockTransactionStatus.paymentReference,
        execution: mockTransactionStatus.execution,
        returnStatus: mockTransactionStatus.returnStatus,
      });

      expect(httpService.post).toHaveBeenCalledWith(
        `/payments/${transactionId}/service-reference/generate`,
        {},
        transactionSignature,
      );
    });

    it('should throw error when reference generation fails', async () => {
      const error = new Error('Generation failed');
      mockHttpService.post.mockRejectedValue(error);

      await expect(
        service.generateMultibancoReference(
          transactionId,
          transactionSignature,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('processWebhook', () => {
    const encryptedPayload = 'encrypted_payload_base64';
    const initializationVector = 'iv_base64';
    const authenticationTag = 'at_base64';

    const decryptedPayload: SibsWebhookPayload = {
      transactionID: 'SIBS_TXN_123',
      merchantTransactionId: 'TXN_123456',
      paymentStatus: 'Success',
      paymentMethod: 'CARD',
      amount: {
        value: 10000,
        currency: 'EUR',
      },
      timestamp: '2025-10-06T10:00:00Z',
      signature: 'test_signature',
      notificationID: 'NOTIF_123',
    };

    const processedWebhook = {
      transactionId: decryptedPayload.transactionID,
      merchantTransactionId: decryptedPayload.merchantTransactionId,
      paymentStatus: decryptedPayload.paymentStatus,
      paymentMethod: decryptedPayload.paymentMethod,
      amount: decryptedPayload.amount,
      timestamp: decryptedPayload.timestamp,
      notificationID: decryptedPayload.notificationID,
    };

    it('should process webhook successfully', () => {
      mockWebhookService.decryptWebhookPayload.mockReturnValue(
        JSON.stringify(decryptedPayload),
      );
      mockWebhookService.processWebhook.mockReturnValue(processedWebhook);

      const result = service.processWebhook(
        encryptedPayload,
        initializationVector,
        authenticationTag,
      );

      expect(result).toEqual(processedWebhook);
      expect(webhookService.decryptWebhookPayload).toHaveBeenCalledWith(
        encryptedPayload,
        initializationVector,
        authenticationTag,
      );
      expect(webhookService.processWebhook).toHaveBeenCalledWith(
        decryptedPayload,
      );
    });

    it('should throw SibsValidationException for invalid JSON', () => {
      mockWebhookService.decryptWebhookPayload.mockReturnValue(
        'invalid json {',
      );

      expect(() =>
        service.processWebhook(
          encryptedPayload,
          initializationVector,
          authenticationTag,
        ),
      ).toThrow(SibsValidationException);
    });

    it('should throw original error when decryption fails', () => {
      const error = new Error('Decryption failed');
      mockWebhookService.decryptWebhookPayload.mockImplementation(() => {
        throw error;
      });

      expect(() =>
        service.processWebhook(
          encryptedPayload,
          initializationVector,
          authenticationTag,
        ),
      ).toThrow(error);
    });
  });
});
