import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../shared/use-case.interface';
import { UserRepository, USER_REPOSITORY_TOKEN } from '@lib/domain';
import { GetUserRequest, GetUserResponse } from '../dtos/get-user.dto';

@Injectable()
export class GetUserUseCase
  implements UseCase<GetUserRequest, GetUserResponse>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly _userRepository: UserRepository,
  ) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
    const user = await this._userRepository.findById(request.id);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email.email,
      isActive: user.isActive,
      hasTwoFA: user.hasTwoFA,
      roleId: user.roleId,
      lastLogin: user.lastLogin,
    };
  }
}
