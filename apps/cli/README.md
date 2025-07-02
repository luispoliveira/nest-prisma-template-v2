# NestJS Prisma Template CLI

A comprehensive command-line interface for managing the NestJS Prisma Template application. This CLI provides powerful tools for user management, role-based access control, API key management, database operations, and queue management.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Yarn package manager
- PostgreSQL database running
- Redis server running (for queue operations)

### Installation

The CLI is built into the project. No additional installation required.

### Basic Usage

```bash
# Show all available commands
yarn command help

# Show usage examples
yarn command examples

# Check application health
yarn command app:health
```

## 📚 Available Commands

### 🎯 Application Commands

```bash
# Display application information
yarn command app:info

# Check health and database connectivity
yarn command app:health

# Show version information
yarn command app:version
```

### 👥 User Management

```bash
# Create a new user
yarn command users:create admin@example.com --password=secret123 --role=admin --active

# List all users
yarn command users:list

# List only active users
yarn command users:list --active-only

# Filter users by role
yarn command users:list --role=admin

# Activate a user
yarn command users:activate 1

# Deactivate a user
yarn command users:deactivate 1

# Reset user password
yarn command users:reset-password 1 --password=newpassword

# Assign role to user
yarn command users:assign-role 1 2
```

### 👑 Role Management

```bash
# Create a new role
yarn command roles:create admin

# List all roles
yarn command roles:list

# Activate/deactivate roles
yarn command roles:activate 1
yarn command roles:deactivate 1

# Assign permission to role
yarn command roles:assign-permission 1 5

# Revoke permission from role
yarn command roles:revoke-permission 1 5
```

### 🎫 Permission Management

```bash
# Create a new permission
yarn command permissions:create "users:create" users

# List all permissions
yarn command permissions:list

# Filter by module
yarn command permissions:list --module=users

# List all modules
yarn command permissions:modules

# Bulk create CRUD permissions for a module
yarn command permissions:bulk-create users

# Activate/deactivate permissions
yarn command permissions:activate 1
yarn command permissions:deactivate 1
```

### 🔑 API Key Management

```bash
# Create a new API key
yarn command api-keys:create mobile-app --description="Mobile app API key" --expires-in=365

# List all API keys
yarn command api-keys:list

# List only active API keys
yarn command api-keys:list --active-only

# Revoke an API key
yarn command api-keys:revoke 1

# Clean up expired API keys
yarn command api-keys:cleanup

# Preview cleanup (dry run)
yarn command api-keys:cleanup --dry-run
```

### 🗄️ Database Operations

```bash
# Check database status and statistics
yarn command db:status

# Clean up expired data
yarn command db:cleanup

# Preview cleanup without making changes
yarn command db:cleanup --dry-run

# Show migration status
yarn command db:migrate:status

# Show seeding instructions
yarn command db:seed

# Show Prisma Studio instructions
yarn command db:studio

# Show backup instructions
yarn command db:backup

# Show reset instructions
yarn command db:reset
```

### 📊 Queue Management

```bash
# Show queue status
yarn command queue:status

# List jobs by status
yarn command queue:jobs --status=waiting
yarn command queue:jobs --status=failed --limit=20

# Clean completed and failed jobs
yarn command queue:clean --grace=5000 --limit=100

# Pause/resume queue processing
yarn command queue:pause
yarn command queue:resume

# Retry all failed jobs
yarn command queue:retry-failed

# Add a test job
yarn command queue:add-test-job --delay=10
```

## 💡 Common Workflows

### Setting up a new environment

```bash
# 1. Check application health
yarn command app:health

# 2. Create admin role
yarn command roles:create admin

# 3. Create basic permissions
yarn command permissions:bulk-create users
yarn command permissions:bulk-create roles
yarn command permissions:bulk-create permissions

# 4. Assign permissions to admin role
yarn command roles:assign-permission 1 1
yarn command roles:assign-permission 1 2
yarn command roles:assign-permission 1 3

# 5. Create admin user
yarn command users:create admin@example.com --role=admin --active

# 6. Create API key for application
yarn command api-keys:create main-app --description="Main application API key"
```

### Regular maintenance

```bash
# Check system status
yarn command app:health
yarn command db:status
yarn command queue:status

# Clean up expired data
yarn command db:cleanup --dry-run
yarn command db:cleanup
yarn command api-keys:cleanup

# Monitor queue
yarn command queue:jobs --status=failed
yarn command queue:retry-failed
```

### User management workflow

```bash
# Create user
yarn command users:create user@example.com --role=user

# List users to find ID
yarn command users:list

# Activate user
yarn command users:activate 2

# Reset password if needed
yarn command users:reset-password 2
```

## 🔧 Command Options

Most commands support these common options:

- `--active-only, -a`: Filter to show only active records
- `--dry-run, -d`: Preview changes without applying them
- `--help, -h`: Show help for the specific command
- `--limit, -l`: Limit the number of results returned

## 🔍 Debugging and Troubleshooting

### Check application status

```bash
yarn command app:health
```

### Verify database connection

```bash
yarn command db:status
```

### Check queue health

```bash
yarn command queue:status
```

### View recent failed jobs

```bash
yarn command queue:jobs --status=failed --limit=5
```

## 📝 Examples by Use Case

### Development Setup

```bash
yarn command app:health
yarn command permissions:bulk-create users
yarn command permissions:bulk-create roles
yarn command roles:create admin
yarn command roles:assign-permission 1 1
yarn command users:create dev@test.com --role=admin --active
```

### Production Maintenance

```bash
yarn command db:status
yarn command db:cleanup --dry-run
yarn command api-keys:cleanup --dry-run
yarn command queue:clean --grace=86400000  # 24 hours
```

### User Onboarding

```bash
yarn command users:create newuser@company.com --role=user
yarn command users:list --active-only
yarn command users:activate <user-id>
```

### Security Audit

```bash
yarn command users:list
yarn command api-keys:list
yarn command roles:list
yarn command permissions:list
```

## 🚨 Important Notes

- **Password Security**: Generated passwords are shown only once. Save them immediately.
- **API Keys**: API keys are displayed only during creation. Store them securely.
- **Dry Run**: Always use `--dry-run` option first for destructive operations.
- **Backups**: Run `yarn command db:backup` for backup instructions before major changes.
- **Permissions**: Some operations require database permissions.

## 🔗 Related Commands

- `npm run start:dev:cli`: Start CLI in development mode
- `npm run build:cli`: Build CLI for production
- `npm run start:prod:cli`: Run CLI in production mode

## 📞 Getting Help

- Run `yarn command help` to see all available commands
- Run `yarn command examples` to see usage examples
- Run `yarn command <command> --help` for help on specific commands
- Check the main project README for additional information

---

This CLI leverages the existing library ecosystem of the NestJS Prisma Template, providing a powerful interface for all administrative and maintenance tasks.
