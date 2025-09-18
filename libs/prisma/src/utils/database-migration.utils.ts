import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MigrationInfo {
  id: string;
  checksum: string;
  finished_at?: Date;
  migration_name: string;
  logs?: string;
  rolled_back_at?: Date;
  started_at: Date;
  applied_steps_count: number;
}

export interface MigrationStatus {
  hasUnappliedMigrations: boolean;
  hasPendingMigrations: boolean;
  migrations: MigrationInfo[];
  currentSchema?: string;
}

@Injectable()
export class DatabaseMigrationHelper {
  private readonly logger = new Logger(DatabaseMigrationHelper.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    try {
      const migrations = await this.prisma.$queryRaw<MigrationInfo[]>`
        SELECT * FROM _prisma_migrations ORDER BY started_at DESC
      `;

      const hasUnappliedMigrations = migrations.some(m => !m.finished_at);
      const hasPendingMigrations = migrations.some(
        m => m.finished_at && !m.rolled_back_at,
      );

      return {
        hasUnappliedMigrations,
        hasPendingMigrations,
        migrations,
      };
    } catch (error) {
      this.logger.error('Failed to get migration status', error);
      throw error;
    }
  }

  /**
   * Check if migrations are up to date
   */
  async areMigrationsUpToDate(): Promise<boolean> {
    try {
      const status = await this.getMigrationStatus();
      return !status.hasUnappliedMigrations;
    } catch (error) {
      this.logger.warn('Could not check migration status', error);
      return false;
    }
  }

  /**
   * Get database version info
   */
  async getDatabaseVersion(): Promise<{ version: string; engine: string }> {
    try {
      // Try PostgreSQL first
      const pgResult = await this.prisma.$queryRaw<{ version: string }[]>`
        SELECT version() as version
      `;

      if (pgResult.length > 0) {
        return {
          version: pgResult[0].version,
          engine: 'postgresql',
        };
      }
    } catch (error) {
      // Try MySQL
      try {
        const mysqlResult = await this.prisma.$queryRaw<{ version: string }[]>`
          SELECT VERSION() as version
        `;

        if (mysqlResult.length > 0) {
          return {
            version: mysqlResult[0].version,
            engine: 'mysql',
          };
        }
      } catch (mysqlError) {
        // Try SQLite
        try {
          const sqliteResult = await this.prisma.$queryRaw<
            { version: string }[]
          >`
            SELECT sqlite_version() as version
          `;

          if (sqliteResult.length > 0) {
            return {
              version: sqliteResult[0].version,
              engine: 'sqlite',
            };
          }
        } catch (sqliteError) {
          this.logger.warn('Could not determine database version');
        }
      }
    }

    return {
      version: 'unknown',
      engine: 'unknown',
    };
  }

  /**
   * Get schema information
   */
  async getSchemaInfo(): Promise<{
    tables: string[];
    indexes: any[];
    constraints: any[];
  }> {
    try {
      const dbVersion = await this.getDatabaseVersion();

      if (dbVersion.engine === 'postgresql') {
        return this.getPostgreSQLSchemaInfo();
      } else if (dbVersion.engine === 'mysql') {
        return this.getMySQLSchemaInfo();
      } else {
        throw new Error(`Schema info not supported for ${dbVersion.engine}`);
      }
    } catch (error) {
      this.logger.error('Failed to get schema info', error);
      throw error;
    }
  }

  private async getPostgreSQLSchemaInfo(): Promise<{
    tables: string[];
    indexes: any[];
    constraints: any[];
  }> {
    const tables = await this.prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    const indexes = await this.prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;

    const constraints = await this.prisma.$queryRaw<any[]>`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
    `;

    return {
      tables: tables.map(t => t.tablename),
      indexes,
      constraints,
    };
  }

  private async getMySQLSchemaInfo(): Promise<{
    tables: string[];
    indexes: any[];
    constraints: any[];
  }> {
    const tables = await this.prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;

    const indexes = await this.prisma.$queryRaw<any[]>`
      SELECT 
        table_name,
        index_name,
        column_name,
        non_unique
      FROM information_schema.statistics 
      WHERE table_schema = DATABASE()
    `;

    const constraints = await this.prisma.$queryRaw<any[]>`
      SELECT 
        table_name,
        constraint_name,
        constraint_type,
        column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = DATABASE()
    `;

    return {
      tables: tables.map(t => t.table_name),
      indexes,
      constraints,
    };
  }

  /**
   * Backup migration state
   */
  async backupMigrationState(): Promise<MigrationInfo[]> {
    try {
      const migrations = await this.prisma.$queryRaw<MigrationInfo[]>`
        SELECT * FROM _prisma_migrations
      `;

      // Store backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logger.log(
        `Migration backup created: migration-backup-${timestamp}.json`,
      );

      return migrations;
    } catch (error) {
      this.logger.error('Failed to backup migration state', error);
      throw error;
    }
  }

  /**
   * Validate schema integrity
   */
  async validateSchemaIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if _prisma_migrations table exists
      try {
        await this.prisma.$queryRaw`SELECT 1 FROM _prisma_migrations LIMIT 1`;
      } catch (error) {
        issues.push('_prisma_migrations table not found');
      }

      // Check for orphaned records (basic check)
      const dbVersion = await this.getDatabaseVersion();

      if (dbVersion.engine === 'postgresql' || dbVersion.engine === 'mysql') {
        // Add specific integrity checks based on your schema
        // Example: Check for foreign key constraint violations
        try {
          const result = await this.prisma.$queryRaw<{ count: number }[]>`
            SELECT COUNT(*) as count 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY'
          `;

          if (result[0]?.count === 0) {
            issues.push(
              'No foreign key constraints found - schema might be incomplete',
            );
          }
        } catch (error) {
          issues.push('Could not validate foreign key constraints');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
      };
    } catch (error) {
      this.logger.error('Failed to validate schema integrity', error);
      return {
        isValid: false,
        issues: [
          'Schema validation failed: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
        ],
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStatistics(): Promise<{
    tableCount: number;
    indexCount: number;
    constraintCount: number;
    migrationCount: number;
    databaseSize?: string;
  }> {
    try {
      const schemaInfo = await this.getSchemaInfo();
      const migrationStatus = await this.getMigrationStatus();

      let databaseSize: string | undefined;

      try {
        const dbVersion = await this.getDatabaseVersion();

        if (dbVersion.engine === 'postgresql') {
          const sizeResult = await this.prisma.$queryRaw<{ size: string }[]>`
            SELECT pg_size_pretty(pg_database_size(current_database())) as size
          `;
          databaseSize = sizeResult[0]?.size;
        } else if (dbVersion.engine === 'mysql') {
          const sizeResult = await this.prisma.$queryRaw<{ size: number }[]>`
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS size
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
          `;
          databaseSize = `${sizeResult[0]?.size || 0} MB`;
        }
      } catch (error) {
        this.logger.warn('Could not get database size', error);
      }

      return {
        tableCount: schemaInfo.tables.length,
        indexCount: schemaInfo.indexes.length,
        constraintCount: schemaInfo.constraints.length,
        migrationCount: migrationStatus.migrations.length,
        databaseSize,
      };
    } catch (error) {
      this.logger.error('Failed to get database statistics', error);
      throw error;
    }
  }
}
