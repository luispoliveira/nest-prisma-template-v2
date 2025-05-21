import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { Observable } from "rxjs";
import { LoggedUser } from "../models/user.model";

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(private readonly _clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) this._clsService.set<LoggedUser>("user", user);

    return next.handle();
  }
}
