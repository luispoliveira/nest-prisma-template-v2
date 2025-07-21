<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <h1>NestJS Prisma Template v2</h1>
  <p>A comprehensive, production-ready NestJS monorepo template with advanced authentication, database management, and monitoring capabilities</p>
  
  <p>
    <a href="https://github.com/google/gts"><img src="https://img.shields.io/badge/code%20style-google-blueviolet.svg" alt="Code Style: Google" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8.3-blue.svg" alt="TypeScript" /></a>
    <a href="https://nestjs.com/"><img src="https://img.shields.io/badge/NestJS-11.1.3-red.svg" alt="NestJS" /></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-6.11.0-teal.svg" alt="Prisma" /></a>
    <a href="https://zenstack.dev/"><img src="https://img.shields.io/badge/ZenStack-2.16.0-purple.svg" alt="ZenStack" /></a>
  </p>
</div>

## 🚀 Overview

This is an enterprise-grade **NestJS monorepo template** that provides a solid foundation for building scalable, secure, and maintainable applications. It includes multiple applications, shared libraries, and comprehensive tooling for modern development workflows.

## ✨ Key Features

### 🏗️ **Monorepo Architecture**

- **Multiple Applications**: API server, CLI tools, and background workers
- **Shared Libraries**: Reusable components across applications
- **TypeScript Monorepo**: Fully typed with path mapping and IntelliSense

### 🔐 **Advanced Authentication & Security**

- **JWT Authentication**: Access and refresh token management
- **Two-Factor Authentication (2FA)**: TOTP with QR codes and backup codes
- **Role-Based Access Control (RBAC)**: Flexible permission system
- **Attribute-Based Access Control (ABAC)**: Fine-grained authorization
- **API Key Authentication**: For service-to-service communication
- **Rate Limiting**: Configurable rate limiting with Redis backend
- **Password Security**: Strong validation, bcrypt hashing

### 🗄️ **Database & ORM**

- **Prisma ORM**: Type-safe database access with PostgreSQL
- **ZenStack**: Enhanced Prisma with access policies and validation
- **Database Migrations**: Version-controlled schema changes
- **Seeding**: Automated database seeding for development
- **Connection Pooling**: Optimized database connections

### 📊 **Monitoring & Health Checks**

- **Comprehensive Health Monitoring**: Database, Redis, MongoDB, system metrics
- **Multiple Health Endpoints**: Liveness, readiness, and detailed health checks
- **Terminus Integration**: Production-ready health checks
- **System Metrics**: Memory, disk space, and performance monitoring

### 🔄 **Queue Management**

- **Bull Queue Integration**: Robust job processing with Redis
- **Queue Monitoring**: Real-time health checks and performance metrics
- **Dashboard Service**: Comprehensive queue management interface
- **Job Lifecycle Management**: Complete control over job processing
- **Bulk Operations**: Efficient bulk job processing

### 🎛️ **Admin & Management**

- **AdminJS Integration**: Auto-generated admin interface
- **Express Session Management**: Secure session handling
- **Database Admin**: Direct database management through web interface

### 📡 **API & GraphQL**

- **RESTful API**: Well-structured REST endpoints
- **GraphQL**: Apollo Server integration with type-safe resolvers
- **Swagger Documentation**: Auto-generated API documentation
- **Input Validation**: Comprehensive request validation

### 🐳 **Development & Deployment**

- **Docker Support**: Multi-stage Dockerfile with optimizations
- **Docker Compose**: Complete development environment setup
- **Multiple Databases**: PostgreSQL, MongoDB, and Redis services
- **Hot Reload**: Fast development with watch mode
- **Production Ready**: Optimized builds and security configurations

## 🏛️ Architecture Overview

### Applications (`apps/`)

- **`api/`** - Main REST API and GraphQL server
- **`cli/`** - Command-line tools for administration and utilities
- **`worker/`** - Background job processing application

### Shared Libraries (`libs/`)

- **`audit/`** - Logging and audit trail functionality
- **`auth/`** - Authentication, authorization, and security
- **`common/`** - Shared utilities, types, and constants
- **`graphql/`** - GraphQL schema and resolvers
- **`health/`** - Health monitoring and system checks
- **`prisma/`** - Database service and utilities
- **`queue/`** - Job queue management and monitoring

### Database Schema (`prisma/` & `zenstack/`)

- **ZenStack Models**: Enhanced Prisma models with access policies
- **Migrations**: Database version control
- **Seeders**: Development data setup

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v22+)
- **Yarn** package manager
- **Docker & Docker Compose** (for services)
- **PostgreSQL** (via Docker or local installation)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nest-prisma-template-v2
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Start infrastructure services**

   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Generate Prisma client and run migrations**

   ```bash
   yarn generate
   yarn migrate:dev
   ```

6. **Seed the database**

   ```bash
   yarn prisma:seed
   ```

7. **Start the development server**

   ```bash
   # API server (default)
   yarn start:dev:api

   # CLI application
   yarn start:dev:cli

   # Worker application
   yarn start:dev:worker
   ```

## 🔧 Development Commands

### Building Applications

```bash
yarn build:api        # Build API application
yarn build:cli        # Build CLI application
yarn build:worker     # Build worker application
yarn build:all        # Build all applications
```

### Running Applications

```bash
# Development mode
yarn start:dev:api     # API with hot reload
yarn start:dev:cli     # CLI with hot reload
yarn start:dev:worker  # Worker with hot reload

# Debug mode
yarn start:debug:api   # API with debugger
yarn start:debug:cli   # CLI with debugger
yarn start:debug:worker # Worker with debugger

# Production mode
yarn start:prod:api    # Production API
yarn start:prod:cli    # Production CLI
yarn start:prod:worker # Production Worker
```

### Database Operations

```bash
yarn migrate:dev            # Create and apply migration
yarn migrate:dev:create     # Create migration only
yarn migrate:deploy         # Deploy migrations (production)
yarn prisma:generate        # Generate Prisma client
yarn prisma:studio          # Open Prisma Studio
yarn prisma:seed            # Run database seeders
yarn prisma:migrate:reset   # Reset database and apply migrations
yarn generate               # Generate ZenStack and Prisma code
```

### Code Quality

```bash
yarn lint              # Lint code
yarn fix               # Fix linting issues
yarn format            # Format code with Prettier
yarn test              # Run tests
```

## 🌐 API Endpoints

Once running, you can access:

- **API Server**: `http://localhost:3000`
- **GraphQL Playground**: `http://localhost:3000/graphql`
- **Swagger Documentation**: `http://localhost:3000/api`
- **Health Checks**: `http://localhost:3000/health`
- **Prisma Studio**: `http://localhost:5555`

### Health Check Endpoints

- `/health` - Complete health status
- `/health/detailed` - Detailed health information
- `/health/liveness` - Kubernetes liveness probe
- `/health/readiness` - Kubernetes readiness probe
- `/health/system` - System metrics and information

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/2fa/setup` - Setup two-factor authentication
- `POST /auth/2fa/verify-setup` - Complete 2FA setup
- `POST /auth/2fa/disable` - Disable 2FA

## 🔑 Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://nestjs:password@localhost:5432/nestjs_db"

# Redis
REDIS_URL="redis://localhost:6379"

# MongoDB
MONGODB_URL="mongodb://localhost:27017/nestjs_mongo"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
APP_NAME="NestJS Prisma Template"
NODE_ENV="development"
PORT=3000

# Session
SESSION_SECRET="your-session-secret"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-admin-password"
```

## 🐳 Docker Development

The project includes a complete Docker setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

### Services Included

- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **MongoDB**: Document storage
- **Adminer**: Database administration (port 8080)

## 📚 Documentation & Features

### Two-Factor Authentication (2FA)

The template includes enterprise-grade 2FA implementation:

- **TOTP Integration**: Compatible with Google Authenticator, Authy, etc.
- **QR Code Generation**: Automatic QR code creation for easy setup
- **Backup Codes**: Single-use recovery codes
- **Rate Limiting**: Protection against brute force attacks

### Role-Based Access Control (RBAC)

Flexible permission system with:

- **Role Management**: Admin, Moderator, User roles
- **Permission System**: Fine-grained permissions
- **Guards**: Automatic endpoint protection
- **Decorators**: Easy permission checks

### Queue Management

Robust job processing with:

- **Bull Queue**: Redis-backed job queues
- **Queue Monitoring**: Real-time job tracking
- **Failed Job Handling**: Automatic retry mechanisms
- **Dashboard**: Web-based queue management

### Health Monitoring

Comprehensive health checks for:

- **Database Connectivity**: PostgreSQL, MongoDB
- **Cache Status**: Redis health and connectivity
- **System Resources**: Memory, CPU, disk usage
- **External Services**: HTTP endpoint monitoring

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov

# Watch mode
yarn test:watch
```

## 🚀 Production Deployment

### Building for Production

```bash
yarn build:all
```

### Docker Production Build

```bash
docker build -t nest-app .
docker run -p 3000:3000 nest-app
```

### Environment Setup

- Configure production environment variables
- Set up database migrations
- Configure Redis for sessions and caching
- Set up monitoring and logging
- Configure reverse proxy (nginx)

## 📖 Additional Resources

### Related Documentation

- [Authentication Library](./libs/auth/README.md) - Detailed auth documentation
- [Health Library](./libs/health/README.md) - Health monitoring guide
- [Queue Library](./libs/queue/README.md) - Queue management documentation
- [2FA Implementation](./libs/auth/2FA_IMPLEMENTATION.md) - Two-factor auth guide

### Technologies Used

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [ZenStack](https://zenstack.dev/) - Enhanced Prisma with access policies
- [GraphQL](https://graphql.org/) - Query language for APIs
- [Bull](https://github.com/OptimalBits/bull) - Premium Queue package
- [Redis](https://redis.io/) - In-memory data structure store
- [PostgreSQL](https://www.postgresql.org/) - Open source database
- [Docker](https://www.docker.com/) - Containerization platform

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS Team](https://github.com/nestjs/nest) - For the amazing framework
- [Prisma Team](https://github.com/prisma/prisma) - For the excellent ORM
- [ZenStack Team](https://github.com/zenstackhq/zenstack) - For enhanced Prisma capabilities
