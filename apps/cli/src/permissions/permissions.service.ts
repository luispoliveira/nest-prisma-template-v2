import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { Command, Option, Positional } from 'nestjs-command';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Command({
    command: 'permissions:create <name> <module>',
    describe: 'Create a new permission',
  })
  async create(
    @Positional({
      name: 'name',
      describe: 'Permission name',
      type: 'string',
    })
    name: string,
    @Positional({
      name: 'module',
      describe: 'Module name',
      type: 'string',
    })
    module: string,
    @Option({
      name: 'active',
      describe: 'Set permission as active',
      type: 'boolean',
      required: false,
      alias: 'a',
    })
    isActive = true,
  ) {
    try {
      console.log(`\n🎫 Creating permission: ${name}`);
      console.log('═'.repeat(50));

      const permission = await this.prismaService.permission.create({
        data: {
          name,
          module,
          isActive,
          createdBy: 'CLI',
        },
      });

      console.log('✅ Permission created successfully!');
      console.log(`📝 Name: ${permission.name}`);
      console.log(`📦 Module: ${permission.module}`);
      console.log(
        `📊 Status: ${permission.isActive ? '🟢 Active' : '🔴 Inactive'}`,
      );
      console.log(`🆔 ID: ${permission.id}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to create permission: ${error.message}`);
      console.error('❌ Failed to create permission:', error.message);
      process.exit(1);
    }
  }

  @Command({
    command: 'permissions:list',
    describe: 'List all permissions',
  })
  async list(
    @Option({
      name: 'active-only',
      describe: 'Show only active permissions',
      type: 'boolean',
      required: false,
      alias: 'a',
    })
    activeOnly = false,
    @Option({
      name: 'module',
      describe: 'Filter by module name',
      type: 'string',
      required: false,
      alias: 'm',
    })
    moduleName?: string,
  ) {
    try {
      console.log('\n🎫 Permissions');
      console.log('═'.repeat(80));

      const where: any = {};
      if (activeOnly) where.isActive = true;
      if (moduleName) where.module = moduleName;

      const permissions = await this.prismaService.permission.findMany({
        where,
        include: {
          _count: {
            select: {
              Permission2Role: true,
              Permission2User: true,
            },
          },
        },
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
      });

      if (permissions.length === 0) {
        console.log('📭 No permissions found');
        return;
      }

      let currentModule = '';
      permissions.forEach((permission, index) => {
        if (permission.module !== currentModule) {
          if (currentModule !== '') console.log('');
          console.log(`📦 Module: ${permission.module}`);
          console.log('─'.repeat(40));
          currentModule = permission.module;
        }

        const status = permission.isActive ? '🟢 Active' : '🔴 Inactive';

        console.log(`  ${permission.name}`);
        console.log(`    🆔 ID: ${permission.id}`);
        console.log(`    📅 Created: ${permission.createdAt.toISOString()}`);
        console.log(`    📊 Status: ${status}`);
        console.log(`    👑 Roles: ${permission._count.Permission2Role}`);
        console.log(`    👥 Users: ${permission._count.Permission2User}`);
      });

      console.log('\n═'.repeat(80));
    } catch (error: any) {
      this.logger.error(`Failed to list permissions: ${error.message}`);
      console.error('❌ Failed to list permissions:', error.message);
    }
  }

  @Command({
    command: 'permissions:modules',
    describe: 'List all modules with permission counts',
  })
  async listModules() {
    try {
      console.log('\n📦 Modules');
      console.log('═'.repeat(50));

      const modules = await this.prismaService.permission.groupBy({
        by: ['module'],
        _count: {
          module: true,
        },
        orderBy: {
          module: 'asc',
        },
      });

      if (modules.length === 0) {
        console.log('📭 No modules found');
        return;
      }

      modules.forEach((module, index) => {
        console.log(`${index + 1}. ${module.module}`);
        console.log(`   🎫 Permissions: ${module._count.module}`);
      });

      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to list modules: ${error.message}`);
      console.error('❌ Failed to list modules:', error.message);
    }
  }

  @Command({
    command: 'permissions:activate <id>',
    describe: 'Activate a permission by ID',
  })
  async activate(
    @Positional({
      name: 'id',
      describe: 'Permission ID to activate',
      type: 'number',
    })
    id: number,
  ) {
    try {
      console.log(`\n✅ Activating permission with ID: ${id}`);
      console.log('═'.repeat(50));

      const permission = await this.prismaService.permission.findUnique({
        where: { id },
      });

      if (!permission) {
        console.log('❌ Permission not found');
        return;
      }

      await this.prismaService.permission.update({
        where: { id },
        data: { isActive: true },
      });

      console.log('✅ Permission activated successfully!');
      console.log(`📝 Name: ${permission.name}`);
      console.log(`📦 Module: ${permission.module}`);
      console.log(`🆔 ID: ${permission.id}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to activate permission: ${error.message}`);
      console.error('❌ Failed to activate permission:', error.message);
    }
  }

  @Command({
    command: 'permissions:deactivate <id>',
    describe: 'Deactivate a permission by ID',
  })
  async deactivate(
    @Positional({
      name: 'id',
      describe: 'Permission ID to deactivate',
      type: 'number',
    })
    id: number,
  ) {
    try {
      console.log(`\n🚫 Deactivating permission with ID: ${id}`);
      console.log('═'.repeat(50));

      const permission = await this.prismaService.permission.findUnique({
        where: { id },
      });

      if (!permission) {
        console.log('❌ Permission not found');
        return;
      }

      await this.prismaService.permission.update({
        where: { id },
        data: { isActive: false },
      });

      console.log('✅ Permission deactivated successfully!');
      console.log(`📝 Name: ${permission.name}`);
      console.log(`📦 Module: ${permission.module}`);
      console.log(`🆔 ID: ${permission.id}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to deactivate permission: ${error.message}`);
      console.error('❌ Failed to deactivate permission:', error.message);
    }
  }

  @Command({
    command: 'permissions:bulk-create <module>',
    describe: 'Create common CRUD permissions for a module',
  })
  async bulkCreate(
    @Positional({
      name: 'module',
      describe: 'Module name',
      type: 'string',
    })
    module: string,
  ) {
    try {
      console.log(`\n🎫 Creating CRUD permissions for module: ${module}`);
      console.log('═'.repeat(50));

      const permissions = [
        `${module}:create`,
        `${module}:read`,
        `${module}:update`,
        `${module}:delete`,
        `${module}:list`,
      ];

      const createdPermissions = [];

      for (const permissionName of permissions) {
        try {
          const permission = await this.prismaService.permission.create({
            data: {
              name: permissionName,
              module,
              isActive: true,
              createdBy: 'CLI',
            },
          });
          createdPermissions.push(permission);
        } catch (error) {
          console.log(`⚠️  Permission ${permissionName} already exists`);
        }
      }

      console.log(`✅ Created ${createdPermissions.length} permissions:`);
      createdPermissions.forEach(permission => {
        console.log(`  🎫 ${permission.name} (ID: ${permission.id})`);
      });

      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to bulk create permissions: ${error.message}`);
      console.error('❌ Failed to bulk create permissions:', error.message);
    }
  }
}
