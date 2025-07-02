import { ContextUtil } from "@lib/common";
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY, RateLimitOptions } from "../decorators/rate-limit.decorator";
import { RateLimitService } from "../services/rate-limit.service";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rateLimitOptions) {
      return true;
    }

    const request = ContextUtil.getRequest(context);

    // Generate key for rate limiting
    const key = rateLimitOptions.keyGenerator
      ? rateLimitOptions.keyGenerator(request)
      : this.getDefaultKey(request);

    const result = this.rateLimitService.checkRateLimit(key, rateLimitOptions);

    if (!result.allowed) {
      const response = context.switchToHttp().getResponse();

      // Set rate limit headers
      response.set({
        "X-RateLimit-Limit": rateLimitOptions.maxAttempts.toString(),
        "X-RateLimit-Remaining": result.remainingAttempts.toString(),
        "X-RateLimit-Reset": result.resetTime.toISOString(),
      });

      if (result.blockedUntil) {
        response.set("X-RateLimit-Blocked-Until", result.blockedUntil.toISOString());
      }

      throw new HttpException(
        {
          message: "Rate limit exceeded",
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          blockedUntil: result.blockedUntil?.toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers to response
    const response = context.switchToHttp().getResponse();
    response.set({
      "X-RateLimit-Limit": rateLimitOptions.maxAttempts.toString(),
      "X-RateLimit-Remaining": result.remainingAttempts.toString(),
      "X-RateLimit-Reset": result.resetTime.toISOString(),
    });

    return true;
  }

  private getDefaultKey(request: any): string {
    // Use IP address as default key
    const ip = request.ip || request.connection.remoteAddress || request.socket.remoteAddress;
    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    return `${ip}:${endpoint}`;
  }
}
