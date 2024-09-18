import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Observable, tap } from 'rxjs';
import { ContextUtil } from '../utils/context.util';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly _blackListedMethods = [
    'signIn',
    'login',
    'register',
    'verifyLogin',
    'whoAmI',
    'recoverPassword',
    'activateAccount',
  ];

  constructor(private readonly _prismaService: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = ContextUtil.getRequest(context);

    const userAgent = request.get('user-agent') || '';
    const { ip, method, url, body, query, params } = request;

    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    const username = request.user?.email || 'anonymous';

    const log = await this._prismaService.log.create({
      data: {
        userAgent,
        ip,
        method,
        url,
        body: body,
        query,
        params,
        username,
        className,
        methodName: handlerName,
      },
    });

    return next.handle().pipe(
      tap(async (res) => {
        await this._prismaService.log.update({
          where: { id: log.id },
          data: {
            response: this._blackListedMethods.includes(handlerName)
              ? undefined
              : res,
          },
        });
      }),
    );
  }
}
