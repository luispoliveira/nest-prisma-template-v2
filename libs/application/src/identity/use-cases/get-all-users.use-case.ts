import { Injectable, Inject } from '@nestjs/common';
import { UseCase } from '../../shared/use-case.interface';
import { UserRepository, USER_REPOSITORY_TOKEN } from '@lib/domain';
import {
  GetAllUsersRequest,
  GetAllUsersResponse,
} from '../dtos/get-all-users.dto';

@Injectable()
export class GetAllUsersUseCase
  implements UseCase<GetAllUsersRequest, GetAllUsersResponse>
{
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly _userRepository: UserRepository,
  ) {}

  async execute(_request: GetAllUsersRequest): Promise<GetAllUsersResponse> {
    const users = await this._userRepository.findAll();

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email.email,
        isActive: user.isActive,
        hasTwoFA: user.hasTwoFA,
        roleId: user.roleId,
        lastLogin: user.lastLogin,
      })),
    };
  }
}
