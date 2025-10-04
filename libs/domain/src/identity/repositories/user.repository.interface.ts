import { BaseRepository } from '../../shared/base-repository.interface';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';

export interface UserRepository extends BaseRepository<User, number> {
  findByEmail(_email: Email): Promise<User | null>;
  findActiveUsers(): Promise<User[]>;
  findByActivationToken(_token: string): Promise<User | null>;
  findByResetPasswordToken(_token: string): Promise<User | null>;
}
