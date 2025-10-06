import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SibsWebhookService } from './sibs-webhook.service';

// Define a minimal webhook payload type for testing
type TestWebhookPayload = {
  transactionID: string;
  merchantTransactionId: string;
  paymentStatus: string;
  paymentMethod?: string;
  amount: { value: number; currency: 'EUR' };
  timestamp: string;
  signature: string;
  notificationID: string;
};

describe('SibsWebhookService', () => {
  let service: SibsWebhookService;
  let configService: ConfigService;

  const mockWebhookSecret = Buffer.from(
    'test-secret-key-32-bytes-long!!',
  ).toString('base64');

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'sibs.webhookSecret': mockWebhookSecret,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SibsWebhookService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SibsWebhookService>(SibsWebhookService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('decryptWebhookPayload', () => {
    it('should be defined as a public method', () => {
      // Test that the method exists on the service
      expect(typeof (service as any).decryptWebhookPayload).toBe('function');
    });

    it('should throw error for invalid encryption parameters', () => {
      // Test with invalid parameters
      expect(() => {
        (service as any).decryptWebhookPayload('invalid', 'invalid', 'invalid');
      }).toThrow();
    });
  });

  describe('processWebhook', () => {
    const mockWebhookPayload: TestWebhookPayload = {
      transactionID: 'SIBS_TXN_123',
      merchantTransactionId: 'MERCHANT_TXN_456',
      paymentStatus: 'Success',
      paymentMethod: 'CARD',
      amount: {
        value: 10000,
        currency: 'EUR',
      },
      timestamp: '2025-10-06T10:00:00Z',
      signature: 'test_signature',
      notificationID: 'NOTIF_789',
    };

    it('should process webhook payload successfully', () => {
      const result = service.processWebhook(mockWebhookPayload as any);

      expect(result).toMatchObject({
        transactionId: mockWebhookPayload.transactionID,
        merchantTransactionId: mockWebhookPayload.merchantTransactionId,
        paymentStatus: mockWebhookPayload.paymentStatus,
        paymentMethod: mockWebhookPayload.paymentMethod,
        amount: mockWebhookPayload.amount,
        timestamp: mockWebhookPayload.timestamp,
      });
      expect(result).toHaveProperty('notificationID');
    });

    it('should process webhook without optional paymentMethod', () => {
      const payloadWithoutMethod: TestWebhookPayload = {
        ...mockWebhookPayload,
        paymentMethod: undefined,
      };

      const result = service.processWebhook(payloadWithoutMethod as any);

      expect(result.paymentMethod).toBeUndefined();
      expect(result.transactionId).toBe(payloadWithoutMethod.transactionID);
    });

    it('should handle different payment statuses', () => {
      const statuses = [
        'Processing',
        'Success',
        'Cancelled',
        'Timeout',
        'Failed',
      ];

      statuses.forEach(status => {
        const payload: TestWebhookPayload = {
          ...mockWebhookPayload,
          paymentStatus: status,
        };

        const result = service.processWebhook(payload as any);

        expect(result.paymentStatus).toBe(status);
      });
    });

    it('should handle different payment methods', () => {
      const methods = ['CARD', 'REFERENCE', 'MBWAY'];

      methods.forEach(method => {
        const payload: TestWebhookPayload = {
          ...mockWebhookPayload,
          paymentMethod: method,
        };

        const result = service.processWebhook(payload as any);

        expect(result.paymentMethod).toBe(method);
      });
    });

    it('should process webhook with all required fields', () => {
      const result = service.processWebhook(mockWebhookPayload as any);

      expect(result).toHaveProperty('transactionId');
      expect(result).toHaveProperty('merchantTransactionId');
      expect(result).toHaveProperty('paymentStatus');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('notificationID');
    });
  });
});
