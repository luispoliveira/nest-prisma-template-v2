import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from '../exceptions/base.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string;
    let details: any = {};

    if (exception instanceof BaseException) {
      status = exception.getStatus();
      message = exception.message;
      details = exception.toJSON();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = exceptionResponse;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log the actual error for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      this.logger.error(
        `Unknown exception type: ${exception}`,
        undefined,
        'GlobalExceptionFilter',
      );
    }

    const errorResponse = {
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      correlationId: request.headers['x-correlation-id'] || 'unknown',
      ...details,
    };

    // Log errors for monitoring
    if (status >= 500) {
      this.logger.error(
        `HTTP ${status} Error`,
        JSON.stringify(errorResponse),
        'GlobalExceptionFilter',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status} Warning`,
        JSON.stringify(errorResponse),
        'GlobalExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}
