import { HttpStatus } from '@nestjs/common';
import {
  SibsApiException,
  SibsConfigurationException,
  SibsException,
  SibsTransactionNotFoundException,
  SibsValidationException,
} from './sibs.exception';

describe('SibsException', () => {
  describe('SibsException', () => {
    it('should create exception with default status', () => {
      const exception = new SibsException('Test error');

      expect(exception.message).toBe('Test error');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toMatchObject({
        message: 'Test error',
        timestamp: expect.any(String),
      });
    });

    it('should create exception with custom status', () => {
      const exception = new SibsException(
        'Custom error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should create exception with SIBS error code', () => {
      const exception = new SibsException(
        'Error with code',
        HttpStatus.BAD_REQUEST,
        'SIBS_ERROR_001',
      );

      expect(exception.sibsErrorCode).toBe('SIBS_ERROR_001');
      expect(exception.getResponse()).toMatchObject({
        message: 'Error with code',
        sibsErrorCode: 'SIBS_ERROR_001',
        timestamp: expect.any(String),
      });
    });

    it('should include timestamp in ISO format', () => {
      const exception = new SibsException('Test error');
      const response = exception.getResponse() as any;

      expect(response.timestamp).toBeDefined();
      expect(() => new Date(response.timestamp)).not.toThrow();
    });
  });

  describe('SibsConfigurationException', () => {
    it('should create configuration exception with 500 status', () => {
      const exception = new SibsConfigurationException(
        'Configuration is missing',
      );

      expect(exception.message).toBe('Configuration is missing');
      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should be instance of SibsException', () => {
      const exception = new SibsConfigurationException('Config error');

      expect(exception).toBeInstanceOf(SibsException);
    });
  });

  describe('SibsTransactionNotFoundException', () => {
    it('should create not found exception with transaction ID', () => {
      const transactionId = 'TXN_123456';
      const exception = new SibsTransactionNotFoundException(transactionId);

      expect(exception.message).toBe(
        `Transaction with ID ${transactionId} not found`,
      );
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should be instance of SibsException', () => {
      const exception = new SibsTransactionNotFoundException('TXN_123');

      expect(exception).toBeInstanceOf(SibsException);
    });
  });

  describe('SibsValidationException', () => {
    it('should create validation exception with default status', () => {
      const exception = new SibsValidationException('Invalid data');

      expect(exception.message).toBe('Invalid data');
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should create validation exception with error code', () => {
      const exception = new SibsValidationException(
        'Invalid data',
        'VALIDATION_001',
      );

      expect(exception.sibsErrorCode).toBe('VALIDATION_001');
    });

    it('should be instance of SibsException', () => {
      const exception = new SibsValidationException('Validation error');

      expect(exception).toBeInstanceOf(SibsException);
    });
  });

  describe('SibsApiException', () => {
    it('should create API exception with custom status', () => {
      const exception = new SibsApiException(
        'API error',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      expect(exception.message).toBe('API error');
      expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should create API exception with error code', () => {
      const exception = new SibsApiException(
        'API error',
        HttpStatus.BAD_REQUEST,
        'API_ERROR_001',
      );

      expect(exception.sibsErrorCode).toBe('API_ERROR_001');
    });

    it('should handle different HTTP status codes', () => {
      const statuses = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.NOT_FOUND,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.SERVICE_UNAVAILABLE,
      ];

      statuses.forEach(status => {
        const exception = new SibsApiException('Error', status);
        expect(exception.getStatus()).toBe(status);
      });
    });

    it('should be instance of SibsException', () => {
      const exception = new SibsApiException(
        'API error',
        HttpStatus.BAD_REQUEST,
      );

      expect(exception).toBeInstanceOf(SibsException);
    });
  });
});
