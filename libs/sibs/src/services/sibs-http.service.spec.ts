import { SibsLogService } from '@lib/audit/log/sibs-log.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { SibsApiException } from '../exceptions/sibs.exception';
import { SibsHttpService } from './sibs-http.service';

describe('SibsHttpService', () => {
  let service: SibsHttpService;
  let httpService: HttpService;
  let configService: ConfigService;
  let sibsLogService: SibsLogService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'sibs.baseUrl': 'https://api.sibs.test',
        'sibs.token': 'test_token_123',
        'sibs.clientId': 'test_client_id',
      };
      return config[key];
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockSibsLogService = {
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SibsHttpService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SibsLogService,
          useValue: mockSibsLogService,
        },
      ],
    }).compile();

    service = module.get<SibsHttpService>(SibsHttpService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    sibsLogService = module.get<SibsLogService>(SibsLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('configuration validation', () => {
    it('should initialize with valid configuration', () => {
      // Service is already initialized in beforeEach with valid config
      expect(service).toBeDefined();
      expect(service['baseUrl']).toBe('https://api.sibs.test');
      expect(service['clientId']).toBe('test_client_id');
    });
  });

  describe('post', () => {
    const endpoint = '/payments';
    const requestData = {
      merchant: { terminalId: 'TEST_TERMINAL' },
      transaction: { amount: { value: 10000, currency: 'EUR' } },
    };
    const responseData = { transactionID: 'TXN_123', status: 'created' };

    const mockAxiosResponse: AxiosResponse = {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    beforeEach(() => {
      mockSibsLogService.create.mockResolvedValue({ _id: 'log_123' });
    });

    it('should make POST request successfully with Bearer token', async () => {
      mockHttpService.post.mockReturnValue(of(mockAxiosResponse));

      const result = await service.post(endpoint, requestData);

      expect(result).toEqual(responseData);
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.sibs.test/payments',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-IBM-Client-Id': 'test_client_id',
            Authorization: 'Bearer test_token_123',
          },
        },
      );
      expect(sibsLogService.create).toHaveBeenCalledWith({
        request: requestData,
      });
      expect(sibsLogService.update).toHaveBeenCalledWith('log_123', {
        response: responseData,
        isError: false,
      });
    });

    it('should make POST request with transaction signature', async () => {
      const signature = 'digest_signature_abc';
      mockHttpService.post.mockReturnValue(of(mockAxiosResponse));

      await service.post(endpoint, requestData, signature);

      expect(httpService.post).toHaveBeenCalledWith(
        'https://api.sibs.test/payments',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-IBM-Client-Id': 'test_client_id',
            Authorization: 'Digest digest_signature_abc',
          },
        },
      );
    });

    it('should log error and throw SibsApiException on HTTP error response', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            statusCode: 'INVALID_REQUEST',
            message: 'Invalid payment data',
            statusDescription: 'The request contains invalid parameters',
          },
        },
        config: {},
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      await expect(service.post(endpoint, requestData)).rejects.toThrow(
        SibsApiException,
      );
      await expect(service.post(endpoint, requestData)).rejects.toMatchObject({
        message: 'Invalid payment data',
        getStatus: expect.any(Function),
      });

      expect(sibsLogService.update).toHaveBeenCalledWith('log_123', {
        response: errorResponse.response?.data,
        isError: true,
      });
    });

    it('should throw SibsApiException with default message when error data has no message', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {},
        },
        config: {},
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.post.mockReturnValue(throwError(() => errorResponse));

      await expect(service.post(endpoint, requestData)).rejects.toThrow(
        'SIBS API Error',
      );
    });

    it('should throw SibsApiException with status 503 on network error', async () => {
      const networkError = {
        request: {},
        config: {},
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.post.mockReturnValue(throwError(() => networkError));

      await expect(service.post(endpoint, requestData)).rejects.toThrow(
        'Network error when calling SIBS API',
      );
      await expect(service.post(endpoint, requestData)).rejects.toMatchObject({
        getStatus: expect.any(Function),
      });
    });

    it('should throw SibsApiException with status 500 on unknown error', async () => {
      const unknownError = {
        message: 'Unknown error',
        config: {},
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.post.mockReturnValue(throwError(() => unknownError));

      await expect(service.post(endpoint, requestData)).rejects.toThrow(
        'Unknown error when calling SIBS API',
      );
    });
  });

  describe('get', () => {
    const endpoint = '/payments/TXN_123/status';
    const responseData = {
      transactionID: 'TXN_123',
      paymentStatus: 'Success',
    };

    const mockAxiosResponse: AxiosResponse = {
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    beforeEach(() => {
      mockSibsLogService.create.mockResolvedValue({ _id: 'log_456' });
    });

    it('should make GET request successfully', async () => {
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

      const result = await service.get(endpoint);

      expect(result).toEqual(responseData);
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.sibs.test/payments/TXN_123/status',
        {
          headers: {
            'Content-Type': 'application/json',
            'X-IBM-Client-Id': 'test_client_id',
            Authorization: 'Bearer test_token_123',
          },
        },
      );
      expect(sibsLogService.create).toHaveBeenCalledWith({
        request: endpoint,
      });
      expect(sibsLogService.update).toHaveBeenCalledWith('log_456', {
        response: responseData,
        isError: false,
      });
    });

    it('should make GET request with transaction signature', async () => {
      const signature = 'digest_signature_xyz';
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse));

      await service.get(endpoint, signature);

      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.sibs.test/payments/TXN_123/status',
        {
          headers: {
            'Content-Type': 'application/json',
            'X-IBM-Client-Id': 'test_client_id',
            Authorization: 'Digest digest_signature_xyz',
          },
        },
      );
    });

    it('should throw SibsApiException on GET error', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: 'Transaction not found',
          },
        },
        config: {},
        isAxiosError: true,
      } as AxiosError;

      mockHttpService.get.mockReturnValue(throwError(() => errorResponse));

      await expect(service.get(endpoint)).rejects.toThrow(SibsApiException);
      expect(sibsLogService.update).toHaveBeenCalledWith('log_456', {
        response: errorResponse.response?.data,
        isError: true,
      });
    });
  });
});
