import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { EVENTS, QUEUES } from "../queue.const";

@Injectable()
export class DefaultJob {
  constructor(@InjectQueue(QUEUES.DEFAULT) private readonly _defaultQueue: Queue) {}

  #defaultOptions = {
    removeOnComplete: true,
  };

  async addTestJob() {
    const event = await this._defaultQueue.add(
      EVENTS.TEST,
      {},
      {
        ...this.#defaultOptions,
      },
    );
    return event;
  }

  async addAnotherTestJob() {
    const event = await this._defaultQueue.add(
      EVENTS.ANOTHER_TEST,
      {},
      {
        ...this.#defaultOptions,
      },
    );
    return event;
  }
}
