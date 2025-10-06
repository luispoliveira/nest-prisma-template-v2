import { HttpException, HttpStatus } from '@nestjs/common';

export class SibsException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly sibsErrorCode?: string,
  ) {
    super(
      {
        message,
        sibsErrorCode,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class SibsConfigurationException extends SibsException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class SibsTransactionNotFoundException extends SibsException {
  constructor(transactionId: string) {
    super(
      `Transaction with ID ${transactionId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class SibsValidationException extends SibsException {
  constructor(message: string, sibsErrorCode?: string) {
    super(message, HttpStatus.BAD_REQUEST, sibsErrorCode);
  }
}

export class SibsApiException extends SibsException {
  constructor(message: string, status: HttpStatus, sibsErrorCode?: string) {
    super(message, status, sibsErrorCode);
  }
}
