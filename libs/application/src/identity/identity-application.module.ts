import { Module } from '@nestjs/common';
import { IdentityInfrastructureModule } from '@lib/infrastructure';
import {
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
} from './use-cases';

@Module({
  imports: [IdentityInfrastructureModule],
  providers: [CreateUserUseCase, GetUserUseCase, GetAllUsersUseCase],
  exports: [CreateUserUseCase, GetUserUseCase, GetAllUsersUseCase],
})
export class IdentityApplicationModule {}
