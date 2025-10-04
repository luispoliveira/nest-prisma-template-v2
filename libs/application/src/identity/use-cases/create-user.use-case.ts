import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../shared/use-case.interface';
import {
  User,
  UserRepository,
  Email,
  Password,
  UserDomainService,
  USER_REPOSITORY_TOKEN,
} from '@lib/domain';
import { CreateUserRequest, CreateUserResponse } from '../dtos/create-user.dto';

@Injectable()
export class CreateUserUseCase
  implements UseCase<CreateUserRequest, CreateUserResponse>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly _userRepository: UserRepository,
    private readonly _userDomainService: UserDomainService,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    const email = Email.create(request.email);

    // Domain validation
    const isEmailUnique = await this._userDomainService.isEmailUnique(email);
    if (!isEmailUnique) {
      throw new Error('Email already exists');
    }

    let password: Password | undefined;
    if (request.password) {
      password = await Password.create(request.password);
    }

    // Create domain entity
    const user = User.create({
      email,
      password,
      roleId: request.roleId,
    });

    // Persist
    const savedUser = await this._userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email.email,
      isActive: savedUser.isActive,
    };
  }
}
