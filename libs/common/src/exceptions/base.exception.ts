import { HttpException, HttpStatus } from "@nestjs/common";

export abstract class BaseException extends HttpException {
  public readonly context?: string;
  public readonly timestamp: string;
  public readonly correlationId?: string;

  constructor(message: string, status: HttpStatus, context?: string, correlationId?: string) {
    super(message, status);
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.correlationId = correlationId;
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.getStatus(),
      context: this.context,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
    };
  }
}
