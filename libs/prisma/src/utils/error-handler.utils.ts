import { Prisma } from '@gen/prisma-client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

export interface PrismaErrorDetails {
  code: string;
  message: string;
  field?: string;
  table?: string;
  constraint?: string;
}

export class PrismaErrorHandler {
  private static readonly logger = new Logger(PrismaErrorHandler.name);

  static handlePrismaError(error: any): never {
    if (error.meta?.reason) {
      throw new ForbiddenException('Access denied');
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma known error: ${error.code}`, error.meta);

      switch (error.code) {
        case 'P2000': // Value too long for column type
          throw new BadRequestException(
            `The provided value for the column is too long for the column's type. ${this.getFieldInfo(error)}`,
          );

        case 'P2001': // Record does not exist
          throw new NotFoundException(
            `The record searched for in the where condition does not exist. ${this.getFieldInfo(error)}`,
          );

        case 'P2002': // Unique constraint failed
          const uniqueField = this.extractFieldFromMeta(error.meta);
          throw new ConflictException(
            `Unique constraint failed${uniqueField ? ` on field: ${uniqueField}` : ''}`,
          );

        case 'P2003': // Foreign key constraint failed
          const foreignKeyField = this.extractFieldFromMeta(error.meta);
          throw new BadRequestException(
            `Foreign key constraint failed${foreignKeyField ? ` on field: ${foreignKeyField}` : ''}`,
          );

        case 'P2004': // Constraint failed on the database
          throw new BadRequestException(
            `A constraint failed on the database: ${error.meta?.database_error}`,
          );

        case 'P2005': // Invalid value for column type
          throw new BadRequestException(
            `The value provided for the column is invalid for the column's type. ${this.getFieldInfo(error)}`,
          );

        case 'P2006': // Invalid value for field type
          throw new BadRequestException(
            `The provided value for field is not valid. ${this.getFieldInfo(error)}`,
          );

        case 'P2007': // Data validation error
          throw new BadRequestException(
            `Data validation error: ${error.meta?.database_error}`,
          );

        case 'P2008': // Failed to parse the query
          throw new BadRequestException('Failed to parse the query at');

        case 'P2009': // Failed to validate the query
          throw new BadRequestException('Failed to validate the query');

        case 'P2010': // Raw query failed
          throw new InternalServerErrorException('Raw query failed. Code');

        case 'P2011': // Null constraint violation
          const nullField = this.extractFieldFromMeta(error.meta);
          throw new BadRequestException(
            `Null constraint violation${nullField ? ` on field: ${nullField}` : ''}`,
          );

        case 'P2012': // Missing a required value
          const missingField = this.extractFieldFromMeta(error.meta);
          throw new BadRequestException(
            `Missing a required value${missingField ? ` at field: ${missingField}` : ''}`,
          );

        case 'P2013': // Missing required argument
          throw new BadRequestException(
            `Missing the required argument for field on model. ${this.getFieldInfo(error)}`,
          );

        case 'P2014': // Required relation violates constraint
          throw new BadRequestException(
            `The change you are trying to make would violate the required relation. ${this.getFieldInfo(error)}`,
          );

        case 'P2015': // Related record not found
          throw new NotFoundException(
            `A related record could not be found. ${this.getFieldInfo(error)}`,
          );

        case 'P2016': // Query interpretation error
          throw new BadRequestException('Query interpretation error');

        case 'P2017': // Records for relation are not connected
          throw new BadRequestException(
            `The records for relation between models are not connected. ${this.getFieldInfo(error)}`,
          );

        case 'P2018': // Required connected records not found
          throw new NotFoundException(
            `The required connected records were not found. ${this.getFieldInfo(error)}`,
          );

        case 'P2019': // Input error
          throw new BadRequestException('Input error');

        case 'P2020': // Value out of range
          throw new BadRequestException(
            `Value out of range for the type. ${this.getFieldInfo(error)}`,
          );

        case 'P2021': // Table does not exist
          throw new InternalServerErrorException(
            `The table does not exist in the current database.`,
          );

        case 'P2022': // Column does not exist
          throw new InternalServerErrorException(
            `The column does not exist in the current database.`,
          );

        case 'P2023': // Inconsistent column data
          throw new InternalServerErrorException('Inconsistent column data');

        case 'P2024': // Connection pool timeout
          throw new InternalServerErrorException(
            'Timed out fetching a new connection from the connection pool. More info: ' +
              'https://pris.ly/d/connection-pool',
          );

        case 'P2025': // Record not found for operation
          throw new NotFoundException(
            `An operation failed because it depends on one or more records that were required but not found. ${this.getFieldInfo(error)}`,
          );

        case 'P2026': // Database server error
          throw new InternalServerErrorException(
            `The current database provider doesn't support a feature`,
          );

        case 'P2027': // Multiple errors during query execution
          throw new BadRequestException(
            'Multiple errors occurred on the database during query execution',
          );

        default:
          this.logger.error(
            `Unhandled Prisma error code: ${error.code}`,
            error,
          );
          throw new InternalServerErrorException(
            `Database error: ${error.code}`,
          );
      }
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      this.logger.error('Unknown Prisma error', error);
      throw new InternalServerErrorException(
        'An unknown database error occurred',
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      this.logger.error('Prisma Rust panic', error);
      throw new InternalServerErrorException(
        'A critical database error occurred',
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error('Prisma initialization error', error);
      throw new InternalServerErrorException(
        'Database initialization error occurred',
      );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      this.logger.error('Prisma validation error', error);
      throw new BadRequestException('Invalid query parameters provided');
    } else {
      // Re-throw non-Prisma errors
      throw error;
    }
  }

  /**
   * Extract error details from Prisma error for structured logging
   */
  static extractErrorDetails(error: any): PrismaErrorDetails | null {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        code: error.code,
        message: error.message,
        field: this.extractFieldFromMeta(error.meta),
        table: (error.meta as any)?.table || (error.meta as any)?.model_name,
        constraint: (error.meta as any)?.constraint,
      };
    }
    return null;
  }

  private static extractFieldFromMeta(meta: any): string | undefined {
    if (!meta) return undefined;

    // Try different field name patterns
    return (
      meta.field_name ||
      meta.field ||
      meta.target?.join(', ') ||
      (Array.isArray(meta.target) ? meta.target[0] : undefined)
    );
  }

  private static getFieldInfo(error: any): string {
    const field = this.extractFieldFromMeta(error.meta);
    const table = (error.meta as any)?.table || (error.meta as any)?.model_name;

    let info = '';
    if (table) info += `Table: ${table}`;
    if (field) info += `${info ? ', ' : ''}Field: ${field}`;

    return info ? `(${info})` : '';
  }
}
