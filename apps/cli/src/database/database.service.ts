import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { Command, Option } from 'nestjs-command';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly _prismaService: PrismaService) {}

  @Command({
    command: 'db:status',
    describe: 'Check database connection and show statistics',
  })
  async status() {
    try {
      console.log('\n🗄️  Database Status');
      console.log('═'.repeat(50));

      // Test connection
      await this._prismaService.$queryRaw`SELECT 1`;
      console.log('✅ Connection: Active');

      // Get statistics
      const [users, roles, permissions, apiKeys, sessions] = await Promise.all([
        this._prismaService.user.count(),
        this._prismaService.role.count(),
        this._prismaService.permission.count(),
        this._prismaService.apiKey.count(),
        this._prismaService.session.count(),
      ]);

      console.log(`👥 Users: ${users}`);
      console.log(`👑 Roles: ${roles}`);
      console.log(`🎫 Permissions: ${permissions}`);
      console.log(`🔑 API Keys: ${apiKeys}`);
      console.log(`📝 Sessions: ${sessions}`);

      // Active counts
      const [activeUsers, activeRoles, activeApiKeys] = await Promise.all([
        this._prismaService.user.count({ where: { isActive: true } }),
        this._prismaService.role.count({ where: { isActive: true } }),
        this._prismaService.apiKey.count({ where: { isActive: true } }),
      ]);

      console.log('\n📊 Active Records:');
      console.log(`👥 Active Users: ${activeUsers}`);
      console.log(`👑 Active Roles: ${activeRoles}`);
      console.log(`🔑 Active API Keys: ${activeApiKeys}`);

      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Database check failed: ${error.message}`);
      console.error('❌ Database check failed:', error.message);
      process.exit(1);
    }
  }

  @Command({
    command: 'db:cleanup',
    describe: 'Clean up expired data from database',
  })
  async cleanup(
    @Option({
      name: 'dry-run',
      describe: 'Show what would be cleaned without actually cleaning',
      type: 'boolean',
      required: false,
      alias: 'd',
    })
    dryRun = false,
  ) {
    try {
      console.log('\n🧹 Database Cleanup');
      console.log('═'.repeat(50));

      const now = new Date();

      // Find expired data
      const [expiredApiKeys, expiredSessions, expiredOtps] = await Promise.all([
        this._prismaService.apiKey.count({
          where: { expiresAt: { lt: now } },
        }),
        this._prismaService.session.count({
          where: { expire: { lt: now } },
        }),
        this._prismaService.otp.count({
          where: { expiresAt: { lt: now } },
        }),
      ]);

      console.log('Found expired data:');
      console.log(`🔑 API Keys: ${expiredApiKeys}`);
      console.log(`📝 Sessions: ${expiredSessions}`);
      console.log(`🔐 OTPs: ${expiredOtps}`);

      if (dryRun) {
        console.log('\n🔍 Dry run mode - no changes made');
        return;
      }

      if (expiredApiKeys === 0 && expiredSessions === 0 && expiredOtps === 0) {
        console.log('\n✅ No expired data found');
        return;
      }

      // Clean up expired data
      const [deletedApiKeys, deletedSessions, deletedOtps] = await Promise.all([
        this._prismaService.apiKey.deleteMany({
          where: { expiresAt: { lt: now } },
        }),
        this._prismaService.session.deleteMany({
          where: { expire: { lt: now } },
        }),
        this._prismaService.otp.deleteMany({
          where: { expiresAt: { lt: now } },
        }),
      ]);

      console.log('\n✅ Cleanup completed:');
      console.log(`🔑 Deleted API Keys: ${deletedApiKeys.count}`);
      console.log(`📝 Deleted Sessions: ${deletedSessions.count}`);
      console.log(`🔐 Deleted OTPs: ${deletedOtps.count}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Database cleanup failed: ${error.message}`);
      console.error('❌ Database cleanup failed:', error.message);
    }
  }

  @Command({
    command: 'db:migrate:status',
    describe: 'Show migration status (requires Prisma CLI)',
  })
  async migrateStatus() {
    console.log('\n📊 Migration Status');
    console.log('═'.repeat(50));
    console.log('To check migration status, run:');
    console.log('npx prisma migrate status');
    console.log('═'.repeat(50));
  }

  @Command({
    command: 'db:seed',
    describe: 'Run database seeding (requires Prisma CLI)',
  })
  async seed() {
    console.log('\n🌱 Database Seeding');
    console.log('═'.repeat(50));
    console.log('To run database seeding, run:');
    console.log('npm run prisma:seed');
    console.log('═'.repeat(50));
  }

  @Command({
    command: 'db:studio',
    describe: 'Open Prisma Studio (requires Prisma CLI)',
  })
  async studio() {
    console.log('\n🎨 Prisma Studio');
    console.log('═'.repeat(50));
    console.log('To open Prisma Studio, run:');
    console.log('npm run prisma:studio');
    console.log('═'.repeat(50));
  }

  @Command({
    command: 'db:backup',
    describe: 'Show backup instructions',
  })
  async backup() {
    console.log('\n💾 Database Backup');
    console.log('═'.repeat(50));
    console.log('To create a database backup:');
    console.log('1. PostgreSQL:');
    console.log('   pg_dump $DATABASE_URL > backup.sql');
    console.log('');
    console.log('2. With Docker:');
    console.log(
      '   docker exec -t your-postgres-container pg_dump -U username database > backup.sql',
    );
    console.log('═'.repeat(50));
  }

  @Command({
    command: 'db:reset',
    describe: 'Show database reset instructions',
  })
  async reset() {
    console.log('\n⚠️  Database Reset');
    console.log('═'.repeat(50));
    console.log('⚠️  WARNING: This will delete ALL data!');
    console.log('');
    console.log('To reset the database, run:');
    console.log('npm run prisma:migrate:reset');
    console.log('');
    console.log('This will:');
    console.log('1. Drop the database');
    console.log('2. Run all migrations');
    console.log('3. Run the seed script');
    console.log('═'.repeat(50));
  }
}
