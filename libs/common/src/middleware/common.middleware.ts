import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();

    // Add correlation ID to request
    req.headers["x-correlation-id"] = correlationId;

    // Add correlation ID to response headers
    res.setHeader("x-correlation-id", correlationId);

    next();
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const correlationId = req.headers["x-correlation-id"] || "unknown";

    // Log request start
    console.log(`[${correlationId}] ${req.method} ${req.originalUrl} - START`);

    // Listen for response finish event
    res.on("finish", () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      console.log(
        `[${correlationId}] ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`,
      );
    });

    next();
  }
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    // HSTS header for HTTPS
    if (req.secure) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    next();
  }
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    const clientData = this.requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      // First request or window expired
      this.requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", (this.maxRequests - 1).toString());
      res.setHeader("X-RateLimit-Reset", new Date(now + this.windowMs).toISOString());

      next();
    } else if (clientData.count < this.maxRequests) {
      // Within limit
      clientData.count++;

      res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", (this.maxRequests - clientData.count).toString());
      res.setHeader("X-RateLimit-Reset", new Date(clientData.resetTime).toISOString());

      next();
    } else {
      // Rate limit exceeded
      res.setHeader("X-RateLimit-Limit", this.maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", new Date(clientData.resetTime).toISOString());
      res.setHeader("Retry-After", Math.ceil((clientData.resetTime - now) / 1000).toString());

      res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded",
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    }
  }

  private cleanupExpiredEntries(now: number) {
    for (const [ip, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(ip);
      }
    }
  }
}

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly maxSize: number;

  constructor(maxSize: number = 1024 * 1024) {
    // 1MB default
    this.maxSize = maxSize;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);

    if (contentLength > this.maxSize) {
      res.status(413).json({
        error: "Payload Too Large",
        message: `Request size exceeds the maximum allowed size of ${this.maxSize} bytes`,
      });
      return;
    }

    next();
  }
}
