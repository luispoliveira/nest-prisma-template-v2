import { EnvironmentEnum } from '@lib/common';
import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Command } from 'nestjs-command';

@Injectable()
export class AppCommand {
  private readonly logger = new Logger(AppCommand.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  @Command({
    command: 'app:info',
    describe: 'Display application information',
  })
  async info() {
    const environment = this.configService.get<EnvironmentEnum>('environment');
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    console.log('\n🎯 Application Information');
    console.log('═'.repeat(50));
    console.log(`📦 Name: nest-prisma-template-v2`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(
      `🗄️  Database: ${databaseUrl ? 'Connected' : 'Not configured'}`,
    );
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log('═'.repeat(50));
  }

  @Command({
    command: 'app:health',
    describe: 'Check application health and database connectivity',
  })
  async health() {
    console.log('\n🏥 Health Check');
    console.log('═'.repeat(50));

    try {
      // Test database connection
      await this.prismaService.$queryRaw`SELECT 1`;
      console.log('✅ Database: Connected');
    } catch (error) {
      console.log('❌ Database: Connection failed');
      console.error(error);
    }

    try {
      // Check database stats
      const userCount = await this.prismaService.user.count();
      const roleCount = await this.prismaService.role.count();
      const apiKeyCount = await this.prismaService.apiKey.count();

      console.log(`👥 Users: ${userCount}`);
      console.log(`🔑 Roles: ${roleCount}`);
      console.log(`🗝️  API Keys: ${apiKeyCount}`);
    } catch (error) {
      console.log('❌ Database stats: Failed to retrieve');
    }

    console.log('═'.repeat(50));
  }

  @Command({
    command: 'app:version',
    describe: 'Display version information',
  })
  async version() {
    const packageJson = require('../../../package.json');
    console.log(`\n📦 ${packageJson.name} v${packageJson.version}`);
  }
}
