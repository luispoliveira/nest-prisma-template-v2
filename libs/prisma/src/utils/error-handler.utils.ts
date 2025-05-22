import { Prisma } from "@gen/prisma-client";
import { BadRequestException, NotFoundException } from "@nestjs/common";

export class PrismaErrorHandler {
  static handlePrismaError(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002": // Unique constraint failed
          throw new BadRequestException("Unique constraint failed");
        case "P2003": // Foreign key constraint failed
          throw new BadRequestException("Foreign key constraint failed");
        case "P2004": // The provided value for the column is too long for the column's type
          throw new BadRequestException("Value too long for column");
        case "P2005": // The provided value for the column is invalid
          throw new BadRequestException("Invalid value for column");
        case "P2016": // The record queried does not exist in the database
          throw new NotFoundException("Record not found");
        default:
          throw error;
      }
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      throw new Error("An unknown error occurred");
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      throw new Error("A rust panic occurred");
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error("A client initialization error occurred");
    } else {
      throw error;
    }
  }
}
