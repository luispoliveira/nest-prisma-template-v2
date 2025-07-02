import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse, ApiResponseBuilder } from "../types/api-response.type";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.headers["x-correlation-id"];

    return next.handle().pipe(
      map(data => {
        // If data is already wrapped in an ApiResponse format, return as is
        if (data && typeof data === "object" && "success" in data) {
          return {
            ...data,
            meta: {
              ...data.meta,
              correlationId,
            },
          };
        }

        // Wrap the data in the standard response format
        const response = ApiResponseBuilder.success(data);
        response.meta!.correlationId = correlationId;

        return response;
      }),
    );
  }
}
