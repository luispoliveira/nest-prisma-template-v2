import { ExecutionContext } from '@nestjs/common';

export class ContextUtil {
  static getRequest(context: ExecutionContext) {
    if (context.getType() === 'http')
      return context.switchToHttp().getRequest();
  }
}
