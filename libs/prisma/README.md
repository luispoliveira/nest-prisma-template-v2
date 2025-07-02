# Prisma Library

A comprehensive, production-ready Prisma library for NestJS applications with enhanced utilities, monitoring, and developer experience.

## 🚀 Features

### Core Features

- �️ **Enhanced PrismaService** with health checks, stats, and transaction helpers
- � **Robust Error Handling** with detailed error mapping and context
- 📦 **Generic Base Repository** with CRUD, pagination, and soft delete operations
- 🔍 **Query Builder Utilities** for dynamic query construction with sanitization
- 🔧 **Transaction Helpers** for safe database operations with retry logic

### Advanced Monitoring & Management

- 📊 **Performance Monitoring** with query metrics, slow query detection, and recommendations
- 🌐 **Connection Pool Monitoring** with alerts and health checks
- 🗄️ **Database Migration Utilities** with status tracking and validation
- 🌱 **Database Seeding** with sample data generation and bulk operations
- ❤️ **Comprehensive Health Monitoring** with detailed reports and alerting

### Developer Experience

- 🗑️ **Soft Delete Support** with restore capabilities
- 📄 **Bulk Operations** for improved performance
- 🔐 **Type Safety** with full TypeScript support
- 📚 **Extensive Documentation** and usage examples
- 🧪 **Testing Utilities** for development and CI/CD

## Installation

```bash
npm install @prisma/client
```

## Usage

### Basic Setup

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "@libs/prisma";

@Module({
  imports: [PrismaModule],
  // ...
})
export class AppModule {}
```

### Enhanced PrismaService

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@libs/prisma";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserData) {
    // Automatic error handling
    return this.prisma.executeWithErrorHandling(() => this.prisma.user.create({ data }));
  }

  async getHealthStatus() {
    return this.prisma.healthCheck();
  }

  async getDatabaseStats() {
    return this.prisma.getDatabaseStats();
  }
}
```

### Base Repository Pattern

```typescript
import { Injectable } from "@nestjs/common";
import { BaseRepository } from "@libs/prisma";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected modelName = "user";

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Custom methods specific to User
  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findMany({
      where: { deletedAt: null, isActive: true },
    });
  }
}
```

### Using Base Repository Methods

```typescript
// Create
const user = await userRepository.create({
  email: "user@example.com",
  name: "John Doe",
});

// Find by ID
const user = await userRepository.findById(1);

// Find with options
const users = await userRepository.findMany({
  where: { isActive: true },
  include: { profile: true },
});

// Pagination
const result = await userRepository.findManyWithPagination({
  page: 1,
  limit: 10,
  orderBy: "createdAt",
  orderDirection: "desc",
});

// Update
const updatedUser = await userRepository.update(1, {
  name: "Jane Doe",
});

// Soft delete
await userRepository.softDelete(1);

// Restore
await userRepository.restore(1);

// Hard delete
await userRepository.hardDelete(1);

// Bulk operations
await userRepository.bulkCreate([
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
]);

// Upsert
const user = await userRepository.upsert(
  { email: "user@example.com" },
  { name: "Updated Name" },
  { email: "user@example.com", name: "New User" },
);
```

### Query Builder

```typescript
import { PrismaQueryBuilder } from "@libs/prisma";

// Build dynamic queries
const queryOptions = {
  filters: [
    { field: "isActive", operator: "equals", value: true },
    { field: "createdAt", operator: "gte", value: new Date("2023-01-01") },
    { field: "email", operator: "contains", value: "@example.com" },
  ],
  sorts: [
    { field: "createdAt", direction: "desc" },
    { field: "name", direction: "asc" },
  ],
  limit: 20,
  offset: 0,
};

const prismaQuery = PrismaQueryBuilder.buildQuery(queryOptions);
const users = await prisma.user.findMany(prismaQuery);

// Filter sanitization
const sanitizedFilters = PrismaQueryBuilder.sanitizeFilters(
  unsafeFilters,
  ["name", "email", "isActive"], // allowed fields
);
```

### Transaction Helpers

```typescript
// Safe transaction with automatic rollback on error
const result = await this.prisma.safeTransaction(async tx => {
  const user = await tx.user.create({ data: userData });
  const profile = await tx.profile.create({
    data: { ...profileData, userId: user.id },
  });
  return { user, profile };
});

// Transaction with retry logic
const result = await this.prisma.transactionWithRetry(
  async tx => {
    // Your transaction logic here
    return await tx.user.update({ where: { id: 1 }, data: { name: "Updated" } });
  },
  { maxRetries: 3, retryDelay: 1000 },
);
```

### Error Handling

```typescript
import { PrismaErrorHandler } from "@libs/prisma";

try {
  await prisma.user.create({ data: userData });
} catch (error) {
  const handledError = PrismaErrorHandler.handle(error);
  throw handledError; // Throws appropriate HTTP exception
}

// Error details for logging
const errorDetails = PrismaErrorHandler.getErrorDetails(error);
logger.error("Database operation failed", errorDetails);
```

### Soft Delete Support

```typescript
// Enable soft delete in your Prisma schema
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// Use soft delete methods
await userRepository.softDelete(1); // Sets deletedAt
await userRepository.restore(1);    // Clears deletedAt
await userRepository.hardDelete(1); // Permanently deletes

// Find only non-deleted records
const activeUsers = await userRepository.findManyActive();
```

### Health Monitoring

```typescript
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("database")
  async checkDatabase() {
    const health = await this.prisma.healthCheck();
    return {
      status: health.isHealthy ? "healthy" : "unhealthy",
      ...health,
    };
  }

  @Get("stats")
  async getDatabaseStats() {
    return this.prisma.getDatabaseStats();
  }
}
```

## Advanced Patterns

### Custom Repository with Validation

```typescript
@Injectable()
export class ValidatedUserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  protected modelName = "user";

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: Prisma.UserCreateInput, tx?: PrismaTx): Promise<User> {
    // Custom validation
    if (!data.email?.includes("@")) {
      throw new BadRequestException("Invalid email format");
    }

    // Check for duplicates
    const existing = await this.findFirst({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    return super.create(data, tx);
  }
}
```

### Complex Query Building

```typescript
const complexQuery = PrismaQueryBuilder.buildQuery({
  filters: [
    { field: "profile.age", operator: "gte", value: 18 },
    { field: "roles.name", operator: "in", value: ["admin", "user"] },
    { field: "posts.published", operator: "equals", value: true },
  ],
  sorts: [
    { field: "profile.age", direction: "desc" },
    { field: "createdAt", direction: "asc" },
  ],
  include: {
    profile: true,
    roles: true,
    posts: { where: { published: true } },
  },
});
```

## Configuration

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PRISMA_LOG_LEVEL="info"
PRISMA_ERROR_FORMAT="pretty"
```

### Module Configuration

```typescript
import { Module } from "@nestjs/common";
import { PrismaModule } from "@libs/prisma";

@Module({
  imports: [
    PrismaModule.forRoot({
      logLevel: ["info", "warn", "error"],
      errorFormat: "pretty",
      // Additional Prisma options
    }),
  ],
})
export class AppModule {}
```

## Best Practices

1. **Always use repositories** instead of direct Prisma client access
2. **Implement proper error handling** with try-catch blocks
3. **Use transactions** for operations that modify multiple tables
4. **Leverage soft delete** for data that might need recovery
5. **Monitor database health** in production environments
6. **Use pagination** for large result sets
7. **Sanitize user input** when building dynamic queries
8. **Log database operations** for debugging and monitoring

## Testing

```typescript
describe("UserRepository", () => {
  let repository: UserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UserRepository],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should create user", async () => {
    const user = await repository.create({
      email: "test@example.com",
      name: "Test User",
    });

    expect(user.email).toBe("test@example.com");
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

## Migration and Schema Management

The library works seamlessly with Prisma migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## Contributing

When adding new features:

1. Maintain backward compatibility
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Write tests for new functionality
5. Update documentation

## License

This library is part of the NestJS Prisma Template project.
