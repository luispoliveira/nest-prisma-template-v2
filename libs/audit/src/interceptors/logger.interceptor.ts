import { ContextUtil } from "@lib/common";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, tap } from "rxjs";
import { LogService } from "../log/log.service";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly _blackListedMethods = [
    "signIn",
    "login",
    "register",
    "verifyLogin",
    "whoAmI",
    "recoverPassword",
    "activateAccount",
  ];

  constructor(private readonly _logService: LogService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = ContextUtil.getRequest(context);

    const userAgent = request.get("user-agent") || "";
    const { ip, method, url, body, query, params } = request;

    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    const username = request.user?.email || "anonymous";

    const log = await this._logService.create({
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
    });

    return next.handle().pipe(
      tap(async res => {
        await this._logService.update(log._id!, {
          response: this._blackListedMethods.includes(handlerName) ? undefined : res,
        });
      }),
      catchError(async err => {
        await this._logService.update(log._id!, {
          response: this._blackListedMethods.includes(handlerName) ? undefined : err,
          isError: true,
        });
        throw err;
      }),
    );
  }
}
