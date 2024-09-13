import { ContextUtil } from '@app/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext): User => {
    const request = ContextUtil.getRequest(context);
    return request.user;
  },
);
