import { PrismaService } from "@lib/prisma";
import { Injectable, Logger } from "@nestjs/common";
import { Command, Option, Positional } from "nestjs-command";

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Command({
    command: "roles:create <name>",
    describe: "Create a new role",
  })
  async create(
    @Positional({
      name: "name",
      describe: "Role name",
      type: "string",
    })
    name: string,
    @Option({
      name: "active",
      describe: "Set role as active",
      type: "boolean",
      required: false,
      alias: "a",
    })
    isActive: boolean = true,
  ) {
    try {
      console.log(`\n👑 Creating role: ${name}`);
      console.log("═".repeat(50));

      const role = await this.prismaService.role.create({
        data: {
          name,
          isActive,
          createdBy: "CLI",
        },
      });

      console.log("✅ Role created successfully!");
      console.log(`📝 Name: ${role.name}`);
      console.log(`📊 Status: ${role.isActive ? "🟢 Active" : "🔴 Inactive"}`);
      console.log(`🆔 ID: ${role.id}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to create role: ${error.message}`);
      console.error("❌ Failed to create role:", error.message);
      process.exit(1);
    }
  }

  @Command({
    command: "roles:list",
    describe: "List all roles",
  })
  async list(
    @Option({
      name: "active-only",
      describe: "Show only active roles",
      type: "boolean",
      required: false,
      alias: "a",
    })
    activeOnly: boolean = false,
  ) {
    try {
      console.log("\n👑 Roles");
      console.log("═".repeat(80));

      const roles = await this.prismaService.role.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        include: {
          _count: {
            select: {
              User: true,
              Permission2Role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (roles.length === 0) {
        console.log("📭 No roles found");
        return;
      }

      roles.forEach((role, index) => {
        const status = role.isActive ? "🟢 Active" : "🔴 Inactive";

        console.log(`${index + 1}. ${role.name}`);
        console.log(`   🆔 ID: ${role.id}`);
        console.log(`   📅 Created: ${role.createdAt.toISOString()}`);
        console.log(`   📊 Status: ${status}`);
        console.log(`   👥 Users: ${role._count.User}`);
        console.log(`   🎫 Permissions: ${role._count.Permission2Role}`);
        console.log("");
      });

      console.log("═".repeat(80));
    } catch (error: any) {
      this.logger.error(`Failed to list roles: ${error.message}`);
      console.error("❌ Failed to list roles:", error.message);
    }
  }

  @Command({
    command: "roles:assign-permission <roleId> <permissionId>",
    describe: "Assign a permission to a role",
  })
  async assignPermission(
    @Positional({
      name: "roleId",
      describe: "Role ID",
      type: "number",
    })
    roleId: number,
    @Positional({
      name: "permissionId",
      describe: "Permission ID",
      type: "number",
    })
    permissionId: number,
  ) {
    try {
      console.log(`\n🎫 Assigning permission ${permissionId} to role ${roleId}`);
      console.log("═".repeat(50));

      const role = await this.prismaService.role.findUnique({
        where: { id: roleId },
      });

      const permission = await this.prismaService.permission.findUnique({
        where: { id: permissionId },
      });

      if (!role) {
        console.log("❌ Role not found");
        return;
      }

      if (!permission) {
        console.log("❌ Permission not found");
        return;
      }

      // Check if already assigned
      const existing = await this.prismaService.permission2Role.findUnique({
        where: {
          permissionId_roleId: {
            permissionId,
            roleId,
          },
        },
      });

      if (existing) {
        console.log("⚠️  Permission already assigned to role");
        return;
      }

      await this.prismaService.permission2Role.create({
        data: {
          permissionId,
          roleId,
          isActive: true,
          createdBy: "CLI",
        },
      });

      console.log("✅ Permission assigned successfully!");
      console.log(`👑 Role: ${role.name}`);
      console.log(`🎫 Permission: ${permission.name}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to assign permission: ${error.message}`);
      console.error("❌ Failed to assign permission:", error.message);
    }
  }

  @Command({
    command: "roles:revoke-permission <roleId> <permissionId>",
    describe: "Revoke a permission from a role",
  })
  async revokePermission(
    @Positional({
      name: "roleId",
      describe: "Role ID",
      type: "number",
    })
    roleId: number,
    @Positional({
      name: "permissionId",
      describe: "Permission ID",
      type: "number",
    })
    permissionId: number,
  ) {
    try {
      console.log(`\n🚫 Revoking permission ${permissionId} from role ${roleId}`);
      console.log("═".repeat(50));

      const permission2Role = await this.prismaService.permission2Role.findUnique({
        where: {
          permissionId_roleId: {
            permissionId,
            roleId,
          },
        },
        include: {
          role: true,
          permission: true,
        },
      });

      if (!permission2Role) {
        console.log("❌ Permission assignment not found");
        return;
      }

      await this.prismaService.permission2Role.delete({
        where: {
          permissionId_roleId: {
            permissionId,
            roleId,
          },
        },
      });

      console.log("✅ Permission revoked successfully!");
      console.log(`👑 Role: ${permission2Role.role.name}`);
      console.log(`🎫 Permission: ${permission2Role.permission.name}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to revoke permission: ${error.message}`);
      console.error("❌ Failed to revoke permission:", error.message);
    }
  }

  @Command({
    command: "roles:activate <id>",
    describe: "Activate a role by ID",
  })
  async activate(
    @Positional({
      name: "id",
      describe: "Role ID to activate",
      type: "number",
    })
    id: number,
  ) {
    try {
      console.log(`\n✅ Activating role with ID: ${id}`);
      console.log("═".repeat(50));

      const role = await this.prismaService.role.findUnique({
        where: { id },
      });

      if (!role) {
        console.log("❌ Role not found");
        return;
      }

      await this.prismaService.role.update({
        where: { id },
        data: { isActive: true },
      });

      console.log("✅ Role activated successfully!");
      console.log(`📝 Name: ${role.name}`);
      console.log(`🆔 ID: ${role.id}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to activate role: ${error.message}`);
      console.error("❌ Failed to activate role:", error.message);
    }
  }

  @Command({
    command: "roles:deactivate <id>",
    describe: "Deactivate a role by ID",
  })
  async deactivate(
    @Positional({
      name: "id",
      describe: "Role ID to deactivate",
      type: "number",
    })
    id: number,
  ) {
    try {
      console.log(`\n🚫 Deactivating role with ID: ${id}`);
      console.log("═".repeat(50));

      const role = await this.prismaService.role.findUnique({
        where: { id },
      });

      if (!role) {
        console.log("❌ Role not found");
        return;
      }

      await this.prismaService.role.update({
        where: { id },
        data: { isActive: false },
      });

      console.log("✅ Role deactivated successfully!");
      console.log(`📝 Name: ${role.name}`);
      console.log(`🆔 ID: ${role.id}`);
      console.log("═".repeat(50));
    } catch (error: any) {
      this.logger.error(`Failed to deactivate role: ${error.message}`);
      console.error("❌ Failed to deactivate role:", error.message);
    }
  }
}
