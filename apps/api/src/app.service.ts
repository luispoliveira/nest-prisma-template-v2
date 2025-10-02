import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      response: 'Hello World!',
      code: 200,
    };
  }
}
