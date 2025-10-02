import { ContextUtil } from '@lib/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoggedUser } from '../models/user.model';

export const CurrentUser = createParamDecorator(
  (data, context: ExecutionContext): LoggedUser => {
    const request = ContextUtil.getRequest(context);
    return request.user;
  },
);
