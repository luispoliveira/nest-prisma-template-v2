import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { ContextUtil } from 'src/common/utils/context.util';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext): User => {
    const request = ContextUtil.getRequest(context);
    return request.user;
  },
);
