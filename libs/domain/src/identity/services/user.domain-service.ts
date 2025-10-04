import { Email } from '../value-objects/email.vo';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository.interface';

export class UserDomainService {
  constructor(private readonly _userRepository: UserRepository) {}

  public async isEmailUnique(email: Email): Promise<boolean> {
    const existingUser = await this._userRepository.findByEmail(email);
    return !existingUser;
  }

  public async validateUserForActivation(user: User): Promise<void> {
    if (user.isActive) {
      throw new Error('User is already active');
    }
  }

  public canUserLogin(user: User): boolean {
    return user.isActive;
  }
}
