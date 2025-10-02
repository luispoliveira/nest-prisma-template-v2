import { PasswordUtil } from '@lib/common';
import { PrismaService } from '@lib/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { Command, Option, Positional } from 'nestjs-command';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly _prismaService: PrismaService) {}

  @Command({
    command: 'users:create <email>',
    describe: 'Create a new user',
  })
  async create(
    @Positional({
      name: 'email',
      describe: 'User email address',
      type: 'string',
    })
    email: string,
    @Option({
      name: 'password',
      describe: 'User password (will be generated if not provided)',
      type: 'string',
      required: false,
      alias: 'p',
    })
    password?: string,
    @Option({
      name: 'role',
      describe: 'User role (admin, user)',
      type: 'string',
      required: false,
      alias: 'r',
    })
    roleName?: string,
    @Option({
      name: 'active',
      describe: 'Activate user immediately',
      type: 'boolean',
      required: false,
      alias: 'a',
    })
    active = false,
  ) {
    try {
      console.log(`\n👤 Creating user: ${email}`);
      console.log('═'.repeat(50));

      // Generate password if not provided
      const userPassword = password || uuidv4().substring(0, 12);
      const hashedPassword = await PasswordUtil.hashPassword(userPassword);

      // Find role if specified
      let role = null;
      if (roleName) {
        role = await this._prismaService.role.findFirst({
          where: { name: roleName, isActive: true },
        });
        if (!role) {
          console.log(`❌ Role '${roleName}' not found`);
          return;
        }
      }

      const user = await this._prismaService.user.create({
        data: {
          email,
          password: hashedPassword,
          isActive: active,
          roleId: role?.id,
          activatedAt: active ? new Date() : null,
          activatedBy: 'CLI',
        },
        include: {
          role: true,
        },
      });

      console.log('✅ User created successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: ${userPassword}`);
      console.log(`👑 Role: ${user.role?.name || 'No role assigned'}`);
      console.log(`📊 Status: ${user.isActive ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log('═'.repeat(50));
      console.log(
        "⚠️  IMPORTANT: Save the password now. It won't be shown again!",
      );
    } catch (error: any) {
      this.logger.error(`Failed to create user: ${error.message}`);
      console.error('❌ Failed to create user:', error.message);
      process.exit(1);
    }
  }

  @Command({
    command: 'users:list',
    describe: 'List all users',
  })
  async list(
    @Option({
      name: 'active-only',
      describe: 'Show only active users',
      type: 'boolean',
      required: false,
      alias: 'a',
    })
    activeOnly = false,
    @Option({
      name: 'role',
      describe: 'Filter by role name',
      type: 'string',
      required: false,
      alias: 'r',
    })
    roleName?: string,
  ) {
    try {
      console.log('\n👥 Users');
      console.log('═'.repeat(80));

      const where: any = {};
      if (activeOnly) where.isActive = true;
      if (roleName) {
        where.role = { name: roleName };
      }

      const users = await this._prismaService.user.findMany({
        where,
        include: {
          role: true,
          _count: {
            select: {
              Permission2User: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (users.length === 0) {
        console.log('📭 No users found');
        return;
      }

      users.forEach((user, index) => {
        const status = user.isActive ? '🟢 Active' : '🔴 Inactive';
        const role = user.role?.name || 'No role';
        const lastLogin = user.lastLogin
          ? user.lastLogin.toISOString()
          : 'Never';

        console.log(`${index + 1}. ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   👑 Role: ${role}`);
        console.log(`   📅 Created: ${user.createdAt.toISOString()}`);
        console.log(`   🔐 Last Login: ${lastLogin}`);
        console.log(`   📊 Status: ${status}`);
        console.log(
          `   🔐 2FA: ${user.hasTwoFA ? '✅ Enabled' : '❌ Disabled'}`,
        );
        console.log(`   📞 Phone: ${user.twoFAPhoneNumber || 'Not set'}`);
        console.log(`   🎫 Permissions: ${user._count.Permission2User} direct`);
        console.log('');
      });

      console.log('═'.repeat(80));
    } catch (error: any) {
      this.logger.error(`Failed to list users: ${error.message}`);
      console.error('❌ Failed to list users:', error.message);
    }
  }

  @Command({
    command: 'users:activate <id>',
    describe: 'Activate a user by ID',
  })
  async activate(
    @Positional({
      name: 'id',
      describe: 'User ID to activate',
      type: 'number',
    })
    id: number,
  ) {
    try {
      console.log(`\n✅ Activating user with ID: ${id}`);
      console.log('═'.repeat(50));

      const user = await this._prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        console.log('❌ User not found');
        return;
      }

      await this._prismaService.user.update({
        where: { id },
        data: {
          isActive: true,
          activatedAt: new Date(),
          activatedBy: 'CLI',
        },
      });

      console.log('✅ User activated successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to activate user: ${error.message}`);
      console.error('❌ Failed to activate user:', error.message);
    }
  }

  @Command({
    command: 'users:deactivate <id>',
    describe: 'Deactivate a user by ID',
  })
  async deactivate(
    @Positional({
      name: 'id',
      describe: 'User ID to deactivate',
      type: 'number',
    })
    id: number,
  ) {
    try {
      console.log(`\n🚫 Deactivating user with ID: ${id}`);
      console.log('═'.repeat(50));

      const user = await this._prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        console.log('❌ User not found');
        return;
      }

      await this._prismaService.user.update({
        where: { id },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: 'CLI',
        },
      });

      console.log('✅ User deactivated successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to deactivate user: ${error.message}`);
      console.error('❌ Failed to deactivate user:', error.message);
    }
  }

  @Command({
    command: 'users:reset-password <id>',
    describe: 'Reset user password by ID',
  })
  async resetPassword(
    @Positional({
      name: 'id',
      describe: 'User ID to reset password',
      type: 'number',
    })
    id: number,
    @Option({
      name: 'password',
      describe: 'New password (will be generated if not provided)',
      type: 'string',
      required: false,
      alias: 'p',
    })
    password?: string,
  ) {
    try {
      console.log(`\n🔑 Resetting password for user ID: ${id}`);
      console.log('═'.repeat(50));

      const user = await this._prismaService.user.findUnique({
        where: { id },
      });

      if (!user) {
        console.log('❌ User not found');
        return;
      }

      const newPassword = password || uuidv4().substring(0, 12);
      const hashedPassword = await PasswordUtil.hashPassword(newPassword);

      await this._prismaService.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
        },
      });

      console.log('✅ Password reset successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log('═'.repeat(50));
      console.log(
        "⚠️  IMPORTANT: Save the password now. It won't be shown again!",
      );
    } catch (error: any) {
      this.logger.error(`Failed to reset password: ${error.message}`);
      console.error('❌ Failed to reset password:', error.message);
    }
  }

  @Command({
    command: 'users:assign-role <userId> <roleId>',
    describe: 'Assign a role to a user',
  })
  async assignRole(
    @Positional({
      name: 'userId',
      describe: 'User ID',
      type: 'number',
    })
    userId: number,
    @Positional({
      name: 'roleId',
      describe: 'Role ID',
      type: 'number',
    })
    roleId: number,
  ) {
    try {
      console.log(`\n👑 Assigning role ${roleId} to user ${userId}`);
      console.log('═'.repeat(50));

      const user = await this._prismaService.user.findUnique({
        where: { id: userId },
      });

      const role = await this._prismaService.role.findUnique({
        where: { id: roleId },
      });

      if (!user) {
        console.log('❌ User not found');
        return;
      }

      if (!role) {
        console.log('❌ Role not found');
        return;
      }

      await this._prismaService.user.update({
        where: { id: userId },
        data: { roleId },
      });

      console.log('✅ Role assigned successfully!');
      console.log(`👤 User: ${user.email}`);
      console.log(`👑 Role: ${role.name}`);
      console.log('═'.repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to assign role: ${error.message}`);
      console.error('❌ Failed to assign role:', error.message);
    }
  }
}
