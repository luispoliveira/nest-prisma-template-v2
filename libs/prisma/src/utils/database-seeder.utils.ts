import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTx } from '../types/tx-type';

export interface SeederOptions {
  truncate?: boolean;
  verbose?: boolean;
}

export interface SeedData {
  model: string;
  data: any[];
}

@Injectable()
export class DatabaseSeeder {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed the database with provided data
   */
  async seed(seedData: SeedData[], options: SeederOptions = {}): Promise<void> {
    const { truncate = false, verbose = false } = options;

    try {
      await this.prisma.$transaction(async tx => {
        if (truncate) {
          await this.truncateDatabase(tx, verbose);
        }

        for (const { model, data } of seedData) {
          await this.seedModel(tx, model, data, verbose);
        }
      });

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Database seeding failed', errorMessage);
      throw error;
    }
  }

  /**
   * Seed a specific model with data
   */
  async seedModel(
    tx: PrismaTx,
    modelName: string,
    data: any[],
    verbose = false,
  ): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }

    try {
      const model = (tx as any)[modelName];
      if (!model) {
        throw new Error(`Model ${modelName} not found`);
      }

      if (verbose) {
        this.logger.log(`Seeding ${data.length} records for ${modelName}`);
      }

      // Use createMany for better performance if supported
      if (model.createMany) {
        await model.createMany({
          data,
          skipDuplicates: true,
        });
      } else {
        // Fallback to individual creates
        for (const item of data) {
          await model.create({ data: item });
        }
      }

      if (verbose) {
        this.logger.log(`Successfully seeded ${modelName}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to seed ${modelName}`, errorMessage);
      throw error;
    }
  }

  /**
   * Truncate all tables (careful - this deletes all data!)
   */
  async truncateDatabase(tx: PrismaTx, verbose = false): Promise<void> {
    if (verbose) {
      this.logger.warn('Truncating database...');
    }

    try {
      // Get all table names from schema
      const tables = await this.getTableNames();

      // For PostgreSQL
      if (tables.length > 0) {
        // Disable foreign key checks temporarily (PostgreSQL)
        await tx.$executeRaw`SET session_replication_role = replica;`;

        // Truncate each table
        for (const table of tables) {
          await tx.$executeRaw`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`;
          if (verbose) {
            this.logger.log(`Truncated table: ${table}`);
          }
        }

        // Re-enable foreign key checks
        await tx.$executeRaw`SET session_replication_role = DEFAULT;`;
      }

      if (verbose) {
        this.logger.log('Database truncation completed');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to truncate database', errorMessage);
      throw error;
    }
  }

  /**
   * Get all table names from the database
   */
  private async getTableNames(): Promise<string[]> {
    try {
      // Try PostgreSQL first
      const result = await this.prisma.$queryRaw<{ tablename: string }[]>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      `;

      return result.map(row => row.tablename);
    } catch (error) {
      // Fallback for MySQL/MariaDB
      try {
        const result = await this.prisma.$queryRaw<{ table_name: string }[]>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = DATABASE()
          AND table_name != '_prisma_migrations'
        `;

        return result.map(row => row.table_name);
      } catch (mysqlError) {
        this.logger.warn('Could not determine table names, using manual list');
        // Fallback to common table names - customize this for your schema
        return ['User', 'Post', 'Profile', 'Role', 'Permission'];
      }
    }
  }

  /**
   * Clear specific models
   */
  async clearModels(modelNames: string[], verbose = false): Promise<void> {
    try {
      await this.prisma.$transaction(async tx => {
        for (const modelName of modelNames) {
          const model = (tx as any)[modelName];
          if (model) {
            await model.deleteMany({});
            if (verbose) {
              this.logger.log(`Cleared model: ${modelName}`);
            }
          }
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to clear models', errorMessage);
      throw error;
    }
  }

  /**
   * Check if database has been seeded
   */
  async isSeeded(checkModel = 'user'): Promise<boolean> {
    try {
      const model = (this.prisma as any)[checkModel];
      if (!model) {
        return false;
      }

      const count = await model.count();
      return count > 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Could not check if database is seeded: ${errorMessage}`,
      );
      return false;
    }
  }

  /**
   * Generate sample data for testing
   */
  generateSampleUsers(count = 10): any[] {
    return Array.from({ length: count }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      isActive: Math.random() > 0.2, // 80% active
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ), // Random date within last year
    }));
  }

  generateSamplePosts(userIds: number[], count = 20): any[] {
    const titles = [
      'Getting Started with NestJS',
      'Advanced Prisma Patterns',
      'Building Scalable APIs',
      'Database Design Best Practices',
      'Testing Strategies in Node.js',
      'GraphQL vs REST API',
      'Microservices Architecture',
      'Security in Web Applications',
      'Performance Optimization Tips',
      'Clean Code Principles',
    ];

    return Array.from({ length: count }, (_, i) => ({
      title: titles[Math.floor(Math.random() * titles.length)] + ` #${i + 1}`,
      content: `This is the content for post number ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      published: Math.random() > 0.3, // 70% published
      authorId: userIds[Math.floor(Math.random() * userIds.length)],
      createdAt: new Date(
        Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000,
      ), // Random date within last 6 months
    }));
  }

  /**
   * Seed with sample data for development
   */
  async seedSampleData(options: SeederOptions = {}): Promise<void> {
    const users = this.generateSampleUsers(20);

    // First seed users
    await this.seed([{ model: 'user', data: users }], options);

    // Get created user IDs
    const createdUsers = await this.prisma.user.findMany({
      select: { id: true },
    });
    const userIds = createdUsers.map(u => u.id);

    // Then seed posts
    const posts = this.generateSamplePosts(userIds, 50);
    await this.seed([{ model: 'post', data: posts }]);

    this.logger.log('Sample data seeding completed');
  }
}
