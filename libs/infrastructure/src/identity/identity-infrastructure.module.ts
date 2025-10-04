import { Module } from '@nestjs/common';
import { PrismaModule } from '@lib/prisma';
import {
  UserRepository,
  UserDomainService,
  USER_REPOSITORY_TOKEN,
  ROLE_REPOSITORY_TOKEN,
  PERMISSION_REPOSITORY_TOKEN,
} from '@lib/domain';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaPermissionRepository } from './repositories/prisma-permission.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    {
      provide: ROLE_REPOSITORY_TOKEN,
      useClass: PrismaRoleRepository,
    },
    {
      provide: PERMISSION_REPOSITORY_TOKEN,
      useClass: PrismaPermissionRepository,
    },
    {
      provide: UserDomainService,
      useFactory: (userRepository: UserRepository) => {
        return new UserDomainService(userRepository);
      },
      inject: [USER_REPOSITORY_TOKEN],
    },
  ],
  exports: [
    USER_REPOSITORY_TOKEN,
    ROLE_REPOSITORY_TOKEN,
    PERMISSION_REPOSITORY_TOKEN,
    UserDomainService,
  ],
})
export class IdentityInfrastructureModule {}
