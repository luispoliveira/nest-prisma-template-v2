import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { MongoClient } from 'mongodb';

@Injectable()
export class MongoHealthIndicator extends HealthIndicator {
  async isHealthy(
    key: string,
    options: { url: string; timeout?: number },
  ): Promise<HealthIndicatorResult> {
    const startTime = Date.now();
    let client: MongoClient | null = null;

    try {
      client = new MongoClient(options.url, {
        serverSelectionTimeoutMS: options.timeout || 5000,
        connectTimeoutMS: options.timeout || 5000,
      });

      await client.connect();

      // Ping the database to verify connection
      await client.db().admin().ping();

      const duration = Date.now() - startTime;
      const result = this.getStatus(key, true, {
        url: options.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
        duration: `${duration}ms`,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new HealthCheckError(
        `MongoDB health check failed`,
        this.getStatus(key, false, {
          url: options.url.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${duration}ms`,
        }),
      );
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
}
