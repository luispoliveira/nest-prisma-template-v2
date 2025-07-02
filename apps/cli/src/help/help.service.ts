import { Injectable } from "@nestjs/common";
import { Command } from "nestjs-command";

@Injectable()
export class HelpService {
  @Command({
    command: "help",
    describe: "Show all available commands and their descriptions",
  })
  async showHelp() {
    console.log("\n📚 NestJS Prisma Template CLI - Available Commands");
    console.log("═".repeat(80));

    const commands = [
      {
        category: "🎯 Application",
        commands: [
          { cmd: "app:info", desc: "Display application information" },
          { cmd: "app:health", desc: "Check application health and database connectivity" },
          { cmd: "app:version", desc: "Display version information" },
        ],
      },
      {
        category: "👥 Users",
        commands: [
          { cmd: "users:create <email>", desc: "Create a new user" },
          { cmd: "users:list", desc: "List all users" },
          { cmd: "users:activate <id>", desc: "Activate a user by ID" },
          { cmd: "users:deactivate <id>", desc: "Deactivate a user by ID" },
          { cmd: "users:reset-password <id>", desc: "Reset user password by ID" },
          { cmd: "users:assign-role <userId> <roleId>", desc: "Assign a role to a user" },
        ],
      },
      {
        category: "👑 Roles",
        commands: [
          { cmd: "roles:create <name>", desc: "Create a new role" },
          { cmd: "roles:list", desc: "List all roles" },
          { cmd: "roles:activate <id>", desc: "Activate a role by ID" },
          { cmd: "roles:deactivate <id>", desc: "Deactivate a role by ID" },
          {
            cmd: "roles:assign-permission <roleId> <permissionId>",
            desc: "Assign permission to role",
          },
          {
            cmd: "roles:revoke-permission <roleId> <permissionId>",
            desc: "Revoke permission from role",
          },
        ],
      },
      {
        category: "🎫 Permissions",
        commands: [
          { cmd: "permissions:create <name> <module>", desc: "Create a new permission" },
          { cmd: "permissions:list", desc: "List all permissions" },
          { cmd: "permissions:modules", desc: "List all modules with permission counts" },
          { cmd: "permissions:activate <id>", desc: "Activate a permission by ID" },
          { cmd: "permissions:deactivate <id>", desc: "Deactivate a permission by ID" },
          { cmd: "permissions:bulk-create <module>", desc: "Create CRUD permissions for a module" },
        ],
      },
      {
        category: "🔑 API Keys",
        commands: [
          { cmd: "api-keys:create <name>", desc: "Create a new API key" },
          { cmd: "api-keys:list", desc: "List all API keys" },
          { cmd: "api-keys:revoke <id>", desc: "Revoke an API key by ID" },
          { cmd: "api-keys:cleanup", desc: "Remove expired API keys" },
        ],
      },
      {
        category: "🗄️ Database",
        commands: [
          { cmd: "db:status", desc: "Check database connection and show statistics" },
          { cmd: "db:cleanup", desc: "Clean up expired data from database" },
          { cmd: "db:migrate:status", desc: "Show migration status" },
          { cmd: "db:seed", desc: "Run database seeding" },
          { cmd: "db:studio", desc: "Open Prisma Studio" },
          { cmd: "db:backup", desc: "Show backup instructions" },
          { cmd: "db:reset", desc: "Show database reset instructions" },
        ],
      },
      {
        category: "📊 Queue",
        commands: [
          { cmd: "queue:status", desc: "Show queue status and statistics" },
          { cmd: "queue:clean", desc: "Clean completed and failed jobs from queue" },
          { cmd: "queue:pause", desc: "Pause job processing" },
          { cmd: "queue:resume", desc: "Resume job processing" },
          { cmd: "queue:jobs", desc: "List jobs in queue" },
          { cmd: "queue:retry-failed", desc: "Retry all failed jobs" },
          { cmd: "queue:add-test-job", desc: "Add a test job to the queue" },
        ],
      },
    ];

    commands.forEach(category => {
      console.log(`\n${category.category}`);
      console.log("─".repeat(50));
      category.commands.forEach(command => {
        console.log(`  ${command.cmd.padEnd(35)} ${command.desc}`);
      });
    });

    console.log("\n📖 Command Options:");
    console.log("─".repeat(50));
    console.log("  Most commands support additional options like:");
    console.log("  --active-only, -a    Show only active records");
    console.log("  --dry-run, -d        Preview changes without applying them");
    console.log("  --help, -h           Show help for specific command");
    console.log("");
    console.log("💡 Examples:");
    console.log("─".repeat(50));
    console.log("  yarn command users:create admin@example.com --password=secret123 --role=admin");
    console.log("  yarn command api-keys:create myapp --description='API key for myapp'");
    console.log("  yarn command permissions:bulk-create users");
    console.log("  yarn command db:cleanup --dry-run");
    console.log("");
    console.log("🚀 For more help on a specific command, run:");
    console.log("  yarn command <command> --help");
    console.log("═".repeat(80));
  }

  @Command({
    command: "examples",
    describe: "Show common usage examples",
  })
  async showExamples() {
    console.log("\n💡 Common Usage Examples");
    console.log("═".repeat(80));

    const examples = [
      {
        title: "🎬 Getting Started",
        commands: ["yarn command app:info", "yarn command app:health", "yarn command db:status"],
      },
      {
        title: "👤 User Management",
        commands: [
          "yarn command users:create admin@example.com --password=admin123 --role=admin --active",
          "yarn command users:list --active-only",
          "yarn command users:reset-password 1",
          "yarn command users:assign-role 1 2",
        ],
      },
      {
        title: "🔐 Role & Permission Setup",
        commands: [
          "yarn command roles:create admin",
          "yarn command permissions:bulk-create users",
          "yarn command roles:assign-permission 1 1",
          "yarn command permissions:list --module=users",
        ],
      },
      {
        title: "🔑 API Key Management",
        commands: [
          "yarn command api-keys:create mobile-app --description='Mobile app API key'",
          "yarn command api-keys:list --active-only",
          "yarn command api-keys:cleanup --dry-run",
        ],
      },
      {
        title: "🗄️ Database Maintenance",
        commands: [
          "yarn command db:status",
          "yarn command db:cleanup --dry-run",
          "yarn command db:cleanup",
        ],
      },
      {
        title: "📊 Queue Management",
        commands: [
          "yarn command queue:status",
          "yarn command queue:add-test-job --delay=10",
          "yarn command queue:jobs --status=failed",
          "yarn command queue:retry-failed",
        ],
      },
    ];

    examples.forEach(example => {
      console.log(`\n${example.title}`);
      console.log("─".repeat(40));
      example.commands.forEach(command => {
        console.log(`  ${command}`);
      });
    });

    console.log("\n🔧 Development Workflow Example:");
    console.log("─".repeat(50));
    console.log("1. yarn command app:health");
    console.log("2. yarn command permissions:bulk-create users");
    console.log("3. yarn command roles:create admin");
    console.log("4. yarn command roles:assign-permission 1 1");
    console.log("5. yarn command users:create admin@test.com --role=admin --active");
    console.log("6. yarn command api-keys:create test-key");
    console.log("═".repeat(80));
  }
}
