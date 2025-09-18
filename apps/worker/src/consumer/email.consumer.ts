import { QUEUES } from '@lib/queue';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor(QUEUES.DEFAULT)
export class EmailConsumer {
  @Process('send-email')
  async sendEmail(job: Job) {
    // Simulate sending email
    console.log(`[EmailConsumer] Sending email:`, job.data);
    // TODO: Integrate with email service
  }
}
