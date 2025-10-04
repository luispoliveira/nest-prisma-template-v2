# DDD + Clean Architecture Implementation

## Overview

This NestJS template has been transformed to follow Domain-Driven Design (DDD) and Clean Architecture (CA) principles, providing a scalable and maintainable codebase that separates business logic from infrastructure concerns.

## Architecture Layers

### 1. Domain Layer (`libs/domain`)

The core business logic layer that contains:

#### Shared Components

- **BaseEntity**: Abstract base class for all domain entities
- **ValueObject**: Base class for value objects
- **AggregateRoot**: Base class for aggregate roots with domain events
- **DomainEvent**: Interface and base class for domain events
- **BaseRepository**: Interface defining repository contracts
- **Repository Tokens**: Dependency injection tokens for repositories

#### Identity Domain

- **Entities**: `User`, `Role`, `Permission` with rich domain behavior
- **Value Objects**: `Email`, `Password` with validation logic
- **Domain Services**: `UserDomainService` for complex business rules
- **Domain Events**: `UserCreatedEvent`, `UserActivatedEvent`
- **Repository Interfaces**: Contracts for data persistence

### 2. Application Layer (`libs/application`)

Orchestrates use cases and coordinates domain objects:

#### Use Cases

- **CreateUserUseCase**: Creates new users with domain validation
- **GetUserUseCase**: Retrieves user by ID
- **GetAllUsersUseCase**: Retrieves all users

#### DTOs

- Request/Response objects for use case boundaries
- Clean separation between API contracts and domain models

### 3. Infrastructure Layer (`libs/infrastructure`)

Implements technical concerns and external dependencies:

#### Repository Implementations

- **PrismaUserRepository**: Implements UserRepository using Prisma ORM
- **PrismaRoleRepository**: Implements RoleRepository using Prisma ORM
- **PrismaPermissionRepository**: Implements PermissionRepository using Prisma ORM

#### Modules

- **IdentityInfrastructureModule**: Configures dependency injection for repositories

### 4. Presentation Layer (`apps/api/src`)

Controllers adapted to use Use Cases instead of direct service calls:

- **UsersController**: Uses dependency-injected use cases
- Clean separation of concerns through use case pattern

## Key DDD Concepts Implemented

### 1. Entities

```typescript
export class User extends AggregateRoot {
  // Rich domain behavior
  public activate(activatedBy: string): void;
  public deactivate(deactivatedBy: string): void;
  public changePassword(newPassword: Password): void;
  // Domain events
  // Business invariants protection
}
```

### 2. Value Objects

```typescript
export class Email extends ValueObject<EmailProps> {
  public static create(email: string): Email {
    // Validation logic
    // Immutability
    // Behavior encapsulation
  }
}
```

### 3. Domain Services

```typescript
export class UserDomainService {
  public async isEmailUnique(email: Email): Promise<boolean>;
  // Complex business rules that don't belong to a single entity
}
```

### 4. Repository Pattern

```typescript
export interface UserRepository extends BaseRepository<User, number> {
  findByEmail(email: Email): Promise<User | null>;
  findActiveUsers(): Promise<User[]>;
  // Domain-focused query methods
}
```

### 5. Domain Events

```typescript
export class UserCreatedEvent extends BaseDomainEvent {
  // Events for cross-cutting concerns
  // Eventual consistency
  // Integration with other bounded contexts
}
```

## Dependency Injection Strategy

Using symbol-based tokens for clean dependency injection:

```typescript
export const USER_REPOSITORY_TOKEN = Symbol('UserRepository');

// In module
{
  provide: USER_REPOSITORY_TOKEN,
  useClass: PrismaUserRepository,
}

// In use case
constructor(
  @Inject(USER_REPOSITORY_TOKEN)
  private readonly userRepository: UserRepository,
) {}
```

## Benefits of This Architecture

### 1. **Separation of Concerns**

- Business logic isolated in domain layer
- Infrastructure concerns separated from business rules
- Clear boundaries between layers

### 2. **Testability**

- Domain logic can be tested in isolation
- Use cases are easily unit testable
- Mock implementations can be easily substituted

### 3. **Maintainability**

- Changes in infrastructure don't affect business logic
- Business rules are centralized in domain entities
- Clear structure makes code easier to understand

### 4. **Scalability**

- New features follow established patterns
- Domain can evolve independently of technical concerns
- Multiple bounded contexts can be added easily

### 5. **Technology Independence**

- Database technology can be changed without affecting business logic
- Framework changes isolated to presentation layer
- External service integrations contained in infrastructure layer

## Migration from Previous Architecture

The original controllers that directly used Prisma services have been refactored to:

1. **Use Cases replace Service Layer**: Business operations now go through dedicated use cases
2. **Domain Entities replace Anemic Models**: Rich domain behavior instead of data structures
3. **Repository Interfaces replace Direct ORM Usage**: Clean abstraction over data access
4. **Value Objects replace Primitive Types**: Strong typing and validation for domain concepts

## Future Enhancements

1. **Domain Events Handler**: Implement event dispatcher for cross-cutting concerns
2. **Specifications Pattern**: Add complex query building capabilities
3. **Additional Bounded Contexts**: Extend architecture to other domains (Audit, Queue, etc.)
4. **CQRS Implementation**: Separate read/write models for complex scenarios
5. **Integration Events**: Cross-bounded context communication

## Usage Examples

### Creating a User

```typescript
// Before (direct Prisma usage)
await prisma.user.create({ data: userData });

// After (DDD approach)
const createUserRequest: CreateUserRequest = {
  email: 'user@example.com',
  password: 'securePassword123',
  roleId: 1,
};
await createUserUseCase.execute(createUserRequest);
```

### Domain Validation

```typescript
// Email validation in domain
const email = Email.create('user@example.com'); // Throws if invalid

// Password validation in domain
const password = await Password.create('securePassword123'); // Throws if invalid

// Business rules in domain service
const isUnique = await userDomainService.isEmailUnique(email);
```

This architecture provides a solid foundation for building complex, maintainable applications while following industry best practices for enterprise software development.
