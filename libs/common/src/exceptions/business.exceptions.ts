import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class BusinessException extends BaseException {
  constructor(message: string, context?: string, correlationId?: string) {
    super(message, HttpStatus.BAD_REQUEST, context, correlationId);
  }
}

export class ValidationException extends BaseException {
  public readonly field?: string;

  constructor(
    message: string,
    field?: string,
    context?: string,
    correlationId?: string,
  ) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, context, correlationId);
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

export class NotFoundRecordException extends BaseException {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message: string,
    resourceType?: string,
    resourceId?: string,
    context?: string,
    correlationId?: string,
  ) {
    super(message, HttpStatus.NOT_FOUND, context, correlationId);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}

export class ConflictException extends BaseException {
  constructor(message: string, context?: string, correlationId?: string) {
    super(message, HttpStatus.CONFLICT, context, correlationId);
  }
}

export class UnauthorizedException extends BaseException {
  constructor(
    message = 'Unauthorized access',
    context?: string,
    correlationId?: string,
  ) {
    super(message, HttpStatus.UNAUTHORIZED, context, correlationId);
  }
}

export class ForbiddenException extends BaseException {
  constructor(
    message = 'Forbidden access',
    context?: string,
    correlationId?: string,
  ) {
    super(message, HttpStatus.FORBIDDEN, context, correlationId);
  }
}

export class RateLimitException extends BaseException {
  public readonly retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    context?: string,
    correlationId?: string,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, context, correlationId);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}
