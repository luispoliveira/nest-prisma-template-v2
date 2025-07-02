/**
 * Prisma Library Usage Examples
 *
 * This file contains practical examples of how to use the enhanced Prisma library
 * in your NestJS applications.
 *
 * Note: This is a documentation file. The examples below show the patterns
 * but may need to be adapted to your specific schema and requirements.
 */

/*
// Example imports for your actual implementation:
import { Injectable, Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { 
  PrismaService, 
  BaseRepository, 
  PrismaQueryBuilder,
  PaginationOptions,
  QueryFilter 
} from '@libs/prisma';
import { User, Post as PostModel, Prisma } from '@prisma/client';
*/

// ================================
// 1. Basic Repository Implementation
// ================================

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

  async getUsersWithPostCount(): Promise<any[]> {
    return this.prisma.executeWithErrorHandling(() =>
      this.prisma.user.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
        },
      }),
    );
  }
}

// ================================
// 2. Advanced Repository with Validation
// ================================

@Injectable()
export class PostRepository extends BaseRepository<
  PostModel,
  Prisma.PostCreateInput,
  Prisma.PostUpdateInput
> {
  protected modelName = "post";

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  // Override create with validation
  async create(data: Prisma.PostCreateInput, tx?: any): Promise<PostModel> {
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

  async findPublishedPosts(): Promise<PostModel[]> {
    return this.findMany({
      where: { published: true },
      include: { author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPostsByCategory(category: string): Promise<PostModel[]> {
    return this.findMany({
      where: {
        categories: { has: category },
        published: true,
      },
    });
  }
}

// ================================
// 3. Service Layer with Business Logic
// ================================

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

// ================================
// 4. Controller with Query Building
// ================================

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
      // Note: This would need to be handled differently in actual Prisma
      // as OR conditions are more complex
      filters.push({
        field: "name",
        operator: "contains",
        value: query.search,
      });
    }

    if (query.minAge) {
      filters.push({
        field: "profile.age",
        operator: "gte",
        value: parseInt(query.minAge),
      });
    }

    if (query.roles && query.roles.length > 0) {
      filters.push({
        field: "roles.name",
        operator: "in",
        value: query.roles,
      });
    }

    // Build query options
    const queryOptions = {
      filters: PrismaQueryBuilder.sanitizeFilters(filters, [
        "isActive",
        "name",
        "email",
        "profile.age",
        "roles.name",
      ]),
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

// ================================
// 5. Health Monitoring Service
// ================================

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
    cutoffDate.setDays(cutoffDate.getDate() - 30); // 30 days ago

    await this.prisma.safeTransaction(async tx => {
      // Hard delete old soft-deleted users
      await tx.user.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
          },
        },
      });

      // Similar cleanup for other entities
    });
  }
}

// ================================
// 6. Advanced Query Examples
// ================================

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
        COUNT(p.id) as post_count,
        AVG(pr.age) as avg_age
      FROM "User" u
      LEFT JOIN "Post" p ON u.id = p."authorId"
      LEFT JOIN "Profile" pr ON u.id = pr."userId"
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

// ================================
// 7. Testing Examples
// ================================

describe("UserRepository", () => {
  let repository: UserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    // Setup test module
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

      await expect(repository.create(userData)).rejects.toThrow(); // Should throw due to unique constraint
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

export {
  AdvancedQueryService,
  DatabaseHealthService,
  PostRepository,
  UserController,
  UserRepository,
  UserService,
};
