import { EVENTS, QUEUES } from '@lib/queue';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { Command, Option } from 'nestjs-command';

@Injectable()
export class QueueStressTestCommand {
  private readonly logger = new Logger(QueueStressTestCommand.name);

  constructor(@InjectQueue(QUEUES.DEFAULT) private defaultQueue: Queue) {}

  @Command({
    command: 'queue:stress-test',
    describe: 'Stress test the default queue by adding many jobs quickly',
  })
  async stressTest(
    @Option({
      name: 'jobs',
      describe: 'Number of jobs to add (default: 1000)',
      type: 'number',
      required: false,
      alias: 'j',
    })
    jobs = 1000,
    @Option({
      name: 'concurrency',
      describe: 'Number of jobs to add in parallel (default: 50)',
      type: 'number',
      required: false,
      alias: 'c',
    })
    concurrency = 50,
  ) {
    this.logger.log(
      `Starting stress test: adding ${jobs} jobs with concurrency ${concurrency}`,
    );
    const start = Date.now();
    let added = 0;
    const addJob = async (i: number) => {
      await this.defaultQueue.add(EVENTS.TEST, {
        i,
        timestamp: new Date().toISOString(),
      });
    };
    const promises = [];
    for (let i = 0; i < jobs; i += concurrency) {
      const batch = [];
      for (let j = 0; j < concurrency && i + j < jobs; j++) {
        batch.push(addJob(i + j));
      }
      await Promise.all(batch);
      added += batch.length;
      if (added % 100 === 0) {
        this.logger.log(`Added ${added}/${jobs} jobs...`);
      }
    }
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    this.logger.log(`Stress test complete: ${jobs} jobs added in ${duration}s`);
  }
}
