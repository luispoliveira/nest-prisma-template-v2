# Copilot Instructions - NestJS Prisma Template v2

## Project Overview

This is an enterprise-grade NestJS monorepo with three applications (`api`, `cli`, `worker`) and seven shared libraries (`auth`, `common`, `prisma`, `health`, `queue`, `audit`, `graphql`). The project uses ZenStack for enhanced Prisma with access policies, comprehensive RBAC/ABAC authorization, and production-ready monitoring.

## 🏗️ Architecture Patterns

### Monorepo Structure

- **Apps**: Independent applications with dedicated entry points (`apps/{api,cli,worker}/src/main.ts`)
- **Libs**: Shared functionality with `@lib/` import aliases (configured in `nest-cli.json`)
- **Generated Code**: Prisma client and class generators output to `generated/` directory

### Database Architecture

- **ZenStack Models**: Primary schema definition in `zenstack/*.zmodel` files
- **Access Policies**: Built into ZenStack models using `@@allow()` and `@@deny()` directives
- **Code Generation**: Run `yarn generate` to update both Prisma client and type classes
- **Migrations**: Use `yarn migrate:dev` for development, `yarn migrate:deploy` for production

## 🔐 Authentication & Authorization

### Multi-Layer Security

```typescript
// Typical controller protection pattern
@UseGuards(JwtAuthGuard, PermissionsGuard, TwoFactorGuard)
@NeedsPermissions("view:users", "create:users")
@RequireTwoFactor()
export class UserController {}
```

### Key Security Components

- **JWT Strategy**: Access/refresh token pattern with configurable expiration
- **API Key Auth**: Service-to-service authentication via header `api-key`
- **2FA System**: TOTP with QR codes and backup codes (`libs/auth/src/services/two-factor.service.ts`)
- **Rate Limiting**: Redis-backed with `@RateLimit()` decorator
- **RBAC/ABAC**: Role and attribute-based permissions via `libs/auth/src/rbac/` and `libs/auth/src/abac/`

### Permission System

- **RBAC Types**: Defined in `libs/common/src/types/rbac-permissions.ts`
- **Guards**: `PermissionsGuard` checks user permissions against route requirements
- **Decorators**: Use `@NeedsPermissions()` and `@Public()` for route authorization

## 🛠️ Development Workflows

### Essential Commands

```bash
# Start applications (choose one)
yarn start:dev:api      # Main API server (port 3000)
yarn start:dev:cli      # CLI tools for admin tasks
yarn start:dev:worker   # Background job processor

# Database operations
yarn generate           # ZenStack + Prisma code generation
yarn migrate:dev        # Create and apply migrations
yarn prisma:seed        # Populate with default data
yarn prisma:studio      # Database GUI (port 5555)

# Multi-app building
yarn build:all          # Builds api, cli, worker in parallel
```

### CLI Commands

The CLI app provides admin utilities via `nestjs-command`. Run with `yarn command <command>`:

- `app:info` - Application diagnostics
- `user:*` - User management commands
- `role:*` - Role administration
- `database:*` - Database utilities

### Testing Strategy

- Health endpoints for monitoring: `/health`, `/health/detailed`, `/health/liveness`
- Queue monitoring via Bull dashboard (if enabled)
- AdminJS interface for database management

## 📦 Library Usage Patterns

### Service Integration

```typescript
// Standard dependency injection pattern for libs
constructor(
  private readonly prismaService: PrismaService,
  private readonly authService: AuthService,
  private readonly queueService: QueueService,
  private readonly healthService: HealthService,
) {}
```

### Queue Operations

```typescript
// Add jobs to queues (defined in QueueModule.register([]))
await this.queueService.addJob("email", { to: "user@example.com" });
await this.queueService.getBulkJobStatus(["job1", "job2"]);
```

### Health Monitoring

- **System Checks**: Memory, disk, database connectivity
- **Service Checks**: Redis, MongoDB, external APIs
- **Configuration**: Environment-driven via health config

## 🚀 Deployment & Docker

### Multi-Stage Build

- **Builder Stage**: Installs dependencies, generates code, builds all apps
- **Production Stage**: Minimal runtime with non-root user
- **App Selection**: Controlled via `NEST_APP` environment variable

### Environment Setup

```bash
# Infrastructure services
docker-compose up -d    # PostgreSQL, Redis, MongoDB, Adminer

# Required environment variables
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
JWT_SECRET="..."
SESSION_SECRET="..."
```

## 🔧 Code Generation

### ZenStack Workflow

1. Edit models in `zenstack/*.zmodel`
2. Run `yarn generate` to update Prisma schema and generated types
3. Create migration with `yarn migrate:dev:create`
4. Apply with `yarn migrate:dev`

### Generated Assets

- **Prisma Client**: `generated/prisma-client/`
- **Type Classes**: `generated/prisma-class-generator/` (for Swagger/validation)
- **Import Path**: Use `@gen/prisma-client` and `@gen/prisma-class-generator`

## 📋 Common Patterns

### Controller Structure

```typescript
@Controller("users")
@ApiTags("Users")
@UseGuards(JwtAuthGuard)
export class UserController {
  @Post()
  @NeedsPermissions("create:users")
  @ApiOperation({ summary: "Create user" })
  async create(@Body() dto: CreateUserDto) {}
}
```

### Error Handling

- **Global Filter**: `GlobalExceptionFilter` in `libs/common`
- **Business Exceptions**: Custom exceptions in `libs/common/src/exceptions/`
- **Validation**: Automatic via `ValidationPipe` with class-validator DTOs

### Configuration Management

- **Typed Config**: Service-based configuration with validation
- **Environment Files**: `.env` with fallbacks in config modules
- **App-Specific**: Each app can have dedicated config modules

This template prioritizes security, scalability, and developer experience. When extending functionality, follow the established patterns for consistency and maintainability.
