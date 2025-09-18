import { Injectable } from '@nestjs/common';
import { EVENTS, QUEUES } from '../queue.const';
import { EnhancedQueueService } from '../services/enhanced-queue.service';

@Injectable()
export class DefaultJob {
  constructor(private readonly enhancedQueueService: EnhancedQueueService) {}

  async addTestJob() {
    const event = await this.enhancedQueueService.addJob(
      QUEUES.DEFAULT,
      EVENTS.TEST,
      {
        payload: {},
      },
    );
    return event;
  }

  async addAnotherTestJob() {
    const event = await this.enhancedQueueService.addJob(
      QUEUES.DEFAULT,
      EVENTS.ANOTHER_TEST,
      {
        payload: {},
      },
    );
    return event;
  }
}
