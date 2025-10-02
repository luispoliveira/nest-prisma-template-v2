import { getQueueToken } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bull';
import { EnhancedQueueService } from './enhanced-queue.service';

@Injectable()
export class QueueIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(QueueIntegrationService.name);
  private static registeredQueueNames: string[] = [];

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly enhancedQueueService: EnhancedQueueService,
  ) {}

  async onModuleInit() {
    // This will be called after all modules are initialized
    // We'll register all Bull queues with the EnhancedQueueService
    await this.registerQueues();
  }

  private async registerQueues(): Promise<void> {
    const queueNames = QueueIntegrationService.registeredQueueNames;

    if (queueNames.length === 0) {
      this.logger.warn('No queue names registered for integration');
      return;
    }

    this.logger.log(
      `Registering ${queueNames.length} queues with EnhancedQueueService`,
    );

    for (const queueName of queueNames) {
      try {
        const queueToken = getQueueToken(queueName);
        const queue = this.moduleRef.get<Queue>(queueToken, { strict: false });

        if (queue) {
          this.enhancedQueueService.registerQueue(queueName, queue);
          this.logger.log(`Successfully registered queue '${queueName}'`);
        } else {
          this.logger.warn(`Queue '${queueName}' not found in module registry`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to register queue '${queueName}' with EnhancedQueueService:`,
          error,
        );
      }
    }
  }

  static setQueueNames(queueNames: string[]): void {
    QueueIntegrationService.registeredQueueNames = queueNames;
  }

  static getQueueNames(): string[] {
    return QueueIntegrationService.registeredQueueNames;
  }
}
