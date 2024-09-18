import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EVENTS, QUEUES } from '../queue.const';

@Injectable()
export class DefaultJob {
  constructor(
    @InjectQueue(QUEUES.DEFAULT) private readonly _defaultQueue: Queue,
  ) {}

  private _defaultOptions = {
    removeOnComplete: true,
  };

  async addTestJob() {
    const event = await this._defaultQueue.add(
      EVENTS.TEST,
      {},
      {
        ...this._defaultOptions,
      },
    );
    return event;
  }

  async addAnotherTestJob() {
    const event = await this._defaultQueue.add(
      EVENTS.ANOTHER_TEST,
      {},
      {
        ...this._defaultOptions,
      },
    );
    return event;
  }
}
