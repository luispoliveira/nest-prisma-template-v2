import { EVENTS, QUEUES } from '@lib/queue';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QUEUES.DEFAULT)
export class DefaultConsumer {
  @Process(EVENTS.TEST)
  async test(_job: Job): Promise<void> {
    console.log('test');
  }

  @Process(EVENTS.ANOTHER_TEST)
  async anotherTest(_job: Job): Promise<void> {
    console.log('another test');
  }
}
