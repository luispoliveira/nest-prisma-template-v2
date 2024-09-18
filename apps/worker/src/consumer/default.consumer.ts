import { EVENTS, QUEUES } from '@lib/queue';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor(QUEUES.DEFAULT)
export class DefaultConsumer extends WorkerHost {
  async process(job: Job, token?: string): Promise<any> {
    switch (job.name) {
      case EVENTS.TEST:
        await this.test(job);
        break;
      case EVENTS.ANOTHER_TEST:
        await this.anotherTest(job);
        break;
    }
  }

  async test(job: Job): Promise<void> {
    console.log('test');
  }

  async anotherTest(job: Job): Promise<void> {
    console.log('another test');
  }
}
