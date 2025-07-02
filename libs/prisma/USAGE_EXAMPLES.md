# Prisma Library Usage Examples

This file contains practical examples of how to use the enhanced Prisma library in your NestJS applications.

## Basic Repository Implementation

```typescript
import { Injectable } from "@nestjs/common";
import { BaseRepository, PrismaService } from "@libs/prisma";
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

  // Custom business logic methods
  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: { profile: true },
    });
  }
}
```

## Advanced Repository with Validation

```typescript
@Injectable()
export class PostRepository extends BaseRepository<
  Post,
  Prisma.PostCreateInput,
  Prisma.PostUpdateInput
> {
  protected modelName = "post";

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Override create with validation
  async create(data: Prisma.PostCreateInput, tx?: any): Promise<Post> {
    // Validate title length
    if (data.title.length < 3) {
      throw new Error("Title must be at least 3 characters long");
    }

    // Check if user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: data.authorId as number },
    });

    if (!userExists) {
      throw new Error("Author does not exist");
    }

    return super.create(data, tx);
  }

  async findPublishedPosts(): Promise<Post[]> {
    return this.findMany({
      where: { published: true },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
```

## Service Layer with Business Logic

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly prisma: PrismaService,
  ) {}

  // Simple CRUD operations
  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.userRepository.create(data);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async updateUser(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.userRepository.update(id, data);
  }

  // Complex business operations with transactions
  async createUserWithProfile(
    userData: Prisma.UserCreateInput,
    profileData: Prisma.ProfileCreateInput,
  ): Promise<{ user: User; profile: any }> {
    return this.prisma.safeTransaction(async tx => {
      // Create user
      const user = await this.userRepository.create(userData, tx);

      // Create profile
      const profile = await tx.profile.create({
        data: {
          ...profileData,
          userId: user.id,
        },
      });

      return { user, profile };
    });
  }

  // Pagination example
  async getUsers(options: PaginationOptions & { search?: string }) {
    const filters: any = {};

    if (options.search) {
      filters.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    return this.userRepository.findManyWithPagination({
      ...options,
      where: filters,
    });
  }

  // Bulk operations
  async bulkUpdateUserStatus(userIds: number[], isActive: boolean): Promise<void> {
    await this.userRepository.bulkUpdate({ id: { in: userIds } }, { isActive });
  }

  // Soft delete with related data
  async deactivateUser(id: number): Promise<void> {
    await this.prisma.safeTransaction(async tx => {
      // Soft delete user
      await this.userRepository.softDelete(id, tx);

      // Archive user's posts
      await this.postRepository.bulkUpdate({ authorId: id }, { published: false }, tx);
    });
  }
}
```

## Controller with Query Building

```typescript
interface UserQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minAge?: string;
  maxAge?: string;
  roles?: string[];
}

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {}

  @Get()
  async getUsers(@Query() query: UserQueryParams) {
    // Build dynamic filters
    const filters: QueryFilter[] = [];

    if (query.isActive !== undefined) {
      filters.push({
        field: "isActive",
        operator: "equals",
        value: query.isActive === "true",
      });
    }

    if (query.search) {
      filters.push({
        field: "name",
        operator: "contains",
        value: query.search,
      });
    }

    // Build query options
    const queryOptions = {
      filters: PrismaQueryBuilder.sanitizeFilters(filters, ["isActive", "name", "email"]),
      sorts: query.sortBy
        ? [
            {
              field: query.sortBy,
              direction: query.sortOrder || "asc",
            },
          ]
        : undefined,
      limit: query.limit ? parseInt(query.limit) : 20,
      offset: query.page ? (parseInt(query.page) - 1) * (parseInt(query.limit) || 20) : 0,
    };

    // Use query builder to construct Prisma query
    const prismaQuery = PrismaQueryBuilder.buildQuery(queryOptions);

    // Execute with repository
    return this.userRepository.findMany({
      ...prismaQuery,
      include: { profile: true, roles: true },
    });
  }

  @Post()
  async createUser(@Body() userData: Prisma.UserCreateInput) {
    return this.userService.createUser(userData);
  }

  @Post(":id/deactivate")
  async deactivateUser(@Param("id") id: string) {
    await this.userService.deactivateUser(parseInt(id));
    return { message: "User deactivated successfully" };
  }
}
```

## Health Monitoring Service

```typescript
@Injectable()
export class DatabaseHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus() {
    const health = await this.prisma.healthCheck();
    const stats = await this.prisma.getDatabaseStats();

    return {
      status: health.isHealthy ? "healthy" : "unhealthy",
      database: health,
      statistics: stats,
      timestamp: new Date().toISOString(),
    };
  }

  async performMaintenance() {
    // Clean up old soft-deleted records
    const cutoffDate = new Date();
    cutoffDate.setDays(cutoffDate.getDate() - 30);

    await this.prisma.safeTransaction(async tx => {
      // Hard delete old soft-deleted users
      await tx.user.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
          },
        },
      });
    });
  }
}
```

## Advanced Query Examples

```typescript
@Injectable()
export class AdvancedQueryService {
  constructor(private readonly prisma: PrismaService) {}

  // Complex aggregation
  async getUserStatistics() {
    return this.prisma.executeWithErrorHandling(() =>
      this.prisma.user.aggregate({
        _count: { id: true },
        _avg: { "profile.age": true },
        _min: { createdAt: true },
        _max: { createdAt: true },
        where: { deletedAt: null },
      }),
    );
  }

  // Raw SQL for complex queries
  async getComplexReport(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        COUNT(p.id) as post_count
      FROM "User" u
      LEFT JOIN "Post" p ON u.id = p."authorId"
      WHERE u."deletedAt" IS NULL
      GROUP BY u.id, u.name
      ORDER BY post_count DESC
      LIMIT 10
    `;
  }

  // Bulk upsert with conflict resolution
  async syncUsersFromExternalSource(externalUsers: any[]) {
    const operations = externalUsers.map(user =>
      this.prisma.user.upsert({
        where: { externalId: user.external_id },
        update: {
          name: user.name,
          email: user.email,
          updatedAt: new Date(),
        },
        create: {
          externalId: user.external_id,
          name: user.name,
          email: user.email,
        },
      }),
    );

    return this.prisma.transactionWithRetry(async tx => {
      return Promise.all(operations);
    });
  }
}
```

## Testing Examples

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

    // Clean database
    await prisma.user.deleteMany();
  });

  describe("create", () => {
    it("should create a user successfully", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
      };

      const user = await repository.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.id).toBeDefined();
    });

    it("should handle duplicate email error", async () => {
      const userData = {
        email: "test@example.com",
        name: "Test User",
      };

      await repository.create(userData);

      await expect(repository.create(userData)).rejects.toThrow();
    });
  });

  describe("pagination", () => {
    beforeEach(async () => {
      // Create test data
      const users = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      await repository.bulkCreate(users);
    });

    it("should paginate results correctly", async () => {
      const result = await repository.findManyWithPagination({
        page: 2,
        limit: 10,
      });

      expect(result.data).toHaveLength(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

## Repository Pattern Best Practices

### 1. Repository Interface Definition

```typescript
export interface IUserRepository {
  create(data: Prisma.UserCreateInput): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findMany(options?: any): Promise<User[]>;
  update(id: number, data: Prisma.UserUpdateInput): Promise<User>;
  delete(id: number): Promise<void>;
}

@Injectable()
export class UserRepository
  extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput>
  implements IUserRepository {
  // Implementation
}
```

### 2. Service Layer Abstraction

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
  ) {}

  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    // Business logic validation
    await this.validateUserData(data);

    // Create user
    const user = await this.userRepository.create(data);

    // Transform to DTO
    return this.transformToResponseDto(user);
  }

  private async validateUserData(data: CreateUserDto): Promise<void> {
    if (await this.userRepository.findByEmail(data.email)) {
      throw new ConflictException("Email already exists");
    }
  }

  private transformToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}
```

### 3. Error Handling Patterns

```typescript
@Injectable()
export class UserService {
  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.userRepository.create(data);
      return this.transformToResponseDto(user);
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictException("Email already exists");
      }
      throw new InternalServerErrorException("Failed to create user");
    }
  }
}
```

This completes the comprehensive usage examples for the enhanced Prisma library.
