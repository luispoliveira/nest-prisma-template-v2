# Common Library

A comprehensive utility library for NestJS applications providing reusable components, utilities, and patterns for building robust and maintainable applications.

## Features

### 🚀 **Core Utilities**

- **Error Handling**: Standardized exception classes and global error filter
- **Response Formatting**: Consistent API response structure with interceptors
- **Configuration Management**: Type-safe configuration utilities
- **Security**: Authentication, encryption, and security utilities
- **Performance**: Caching, rate limiting, and performance monitoring
- **Validation**: Custom validation decorators and DTOs

### 📁 **Directory Structure**

```
src/
├── decorators/          # Custom decorators
├── dtos/               # Data Transfer Objects
├── enum/               # Enumerations
├── exceptions/         # Custom exception classes
├── filters/            # Exception filters
├── helpers/            # Helper functions
├── interceptors/       # Custom interceptors
├── middleware/         # Custom middleware
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── validators/         # Custom validators
```

## Usage Examples

### Error Handling

```typescript
import { BusinessException, NotFoundRecordException, GlobalExceptionFilter } from "@libs/common";

// Custom exceptions
throw new BusinessException("Invalid operation");
throw new NotFoundRecordException("User not found", "User", "123");

// Use global exception filter in main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

### Response Formatting

```typescript
import { ResponseInterceptor, ApiResponseBuilder } from "@libs/common";

// Use response interceptor
app.useGlobalInterceptors(new ResponseInterceptor());

// Manual response building
return ApiResponseBuilder.success(data, "Operation completed");
return ApiResponseBuilder.paginated(items, pagination);
```

### Configuration Management

```typescript
import { ConfigUtil } from "@libs/common";

// Type-safe configuration access
const dbUrl = ConfigUtil.getDatabaseUrl(configService);
const port = ConfigUtil.getAppPort(configService);
const isProduction = ConfigUtil.isProduction(configService);

// Custom configuration with validation
const maxRetries = ConfigUtil.getNumberConfig(configService, "MAX_RETRIES", 3);
const allowedOrigins = ConfigUtil.getArrayConfig(configService, "ALLOWED_ORIGINS");
```

### Security Utilities

```typescript
import { SecurityUtil } from "@libs/common";

// Generate secure tokens
const apiKey = SecurityUtil.generateApiKey("app");
const otp = SecurityUtil.generateOTP(6);
const sessionId = SecurityUtil.generateSessionId();

// OTP verification
const { otp, expiresAt, hash } = SecurityUtil.generateTimeBasedOTP();
const isValid = SecurityUtil.verifyTimeBasedOTP(inputOtp, hash, expiresAt);

// Data sanitization
const cleanInput = SecurityUtil.sanitizeInput(userInput);
```

### Database Utilities

```typescript
import { DatabaseUtil } from "@libs/common";

// Build dynamic where clauses
const where = DatabaseUtil.buildWhereClause(filters);
const orderBy = DatabaseUtil.buildOrderBy("createdAt", "desc");

// Pagination helpers
const skip = DatabaseUtil.calculateSkip(page, limit);
const paginationMeta = DatabaseUtil.buildPaginationMeta(page, limit, total);

// Search queries
const searchQuery = DatabaseUtil.buildSearchQuery(searchTerm, ["name", "email"]);
```

### Advanced Validation

```typescript
import { IsStrongPassword, IsValidSlug, IsNotBlank } from "@libs/common";

export class CreateUserDto {
  @IsNotBlank()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsValidSlug()
  username: string;
}
```

### Performance Utilities

```typescript
import { PerformanceUtil, Cacheable } from '@libs/common';

// Measure execution time
const { result, duration } = await PerformanceUtil.measureTime(
  () => expensiveOperation(),
  'Database query'
);

// Retry with exponential backoff
const result = await PerformanceUtil.retryWithBackoff(
  () => unreliableOperation(),
  3, // max retries
  1000 // base delay
);

// Caching decorator
@Cacheable('user-profile', 300) // 5 minutes TTL
async getUserProfile(userId: string) {
  return this.userService.findById(userId);
}
```

### File Upload Utilities

```typescript
import { FileUtil, MulterFile } from "@libs/common";

// Validate uploaded files
const imageConfig = FileUtil.getFileValidationConfig("image");
FileUtil.validateFile(file, imageConfig);

// Process files
const processedFile = FileUtil.processFile(file, "/uploads", imageConfig);

// File type checking
const isImage = FileUtil.isImage(file.mimetype);
const isDocument = FileUtil.isDocument(file.mimetype);
```

### Health Checks

```typescript
import { HealthCheckUtil } from "@libs/common";

// Individual health checks
const dbHealth = await HealthCheckUtil.checkDatabase(() => prisma.$connect());
const redisHealth = await HealthCheckUtil.checkRedis(redisClient);
const apiHealth = await HealthCheckUtil.checkExternalAPI(
  "Payment API",
  "https://api.payment.com/health",
);

// Aggregate health checks
const systemHealth = await HealthCheckUtil.performHealthChecks({
  database: () => HealthCheckUtil.checkDatabase(() => prisma.$connect()),
  redis: () => HealthCheckUtil.checkRedis(redisClient),
  memory: () => Promise.resolve(HealthCheckUtil.checkMemoryUsage()),
});
```

### Advanced DTOs

```typescript
import { AdvancedPaginationDto, BaseFilterDto } from "@libs/common";

export class UserListDto extends AdvancedPaginationDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserFilterDto extends BaseFilterDto {
  @IsOptional()
  @IsString()
  department?: string;
}
```

### Middleware

```typescript
import {
  CorrelationIdMiddleware,
  RequestLoggingMiddleware,
  SecurityHeadersMiddleware,
  RateLimitingMiddleware,
} from "@libs/common";

// Apply middleware in app module
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationIdMiddleware,
        SecurityHeadersMiddleware,
        RequestLoggingMiddleware,
        new RateLimitingMiddleware(100, 15 * 60 * 1000), // 100 requests per 15 minutes
      )
      .forRoutes("*");
  }
}
```

## Best Practices

### 1. Error Handling

- Use specific exception classes for different error types
- Include correlation IDs for traceability
- Provide meaningful error messages
- Log errors appropriately based on severity

### 2. Configuration

- Use environment-specific configurations
- Validate required configuration at startup
- Use type-safe configuration access
- Document all configuration options

### 3. Security

- Always validate and sanitize user input
- Use secure random generation for tokens
- Implement proper rate limiting
- Set appropriate security headers

### 4. Performance

- Implement caching for frequently accessed data
- Use pagination for large datasets
- Monitor and measure performance metrics
- Implement retry logic for unreliable operations

### 5. Database

- Use parameterized queries to prevent SQL injection
- Implement proper error handling for database operations
- Use database transactions for data consistency
- Optimize queries with proper indexing

## Contributing

When adding new utilities to the common library:

1. Follow the established patterns and naming conventions
2. Include comprehensive TypeScript types
3. Add proper error handling
4. Write unit tests for new functionality
5. Update this README with usage examples
6. Export new utilities from the main index.ts file

## Dependencies

This library relies on the following packages:

- `@nestjs/common`
- `@nestjs/config`
- `class-validator`
- `class-transformer`
- `@nestjs/swagger`
- `bcrypt`
- `uuid`
- `crypto` (Node.js built-in)

Make sure these dependencies are available in your project when using this library.
