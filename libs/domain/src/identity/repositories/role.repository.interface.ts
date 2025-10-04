import { BaseRepository } from '../../shared/base-repository.interface';
import { Role } from '../entities/role.entity';

export interface RoleRepository extends BaseRepository<Role, number> {
  findByName(_name: string): Promise<Role | null>;
  findActiveRoles(): Promise<Role[]>;
}
