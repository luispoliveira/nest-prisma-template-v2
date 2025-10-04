import { BaseRepository } from '../../shared/base-repository.interface';
import { Permission } from '../entities/permission.entity';

export interface PermissionRepository
  extends BaseRepository<Permission, number> {
  findByName(_name: string): Promise<Permission | null>;
  findByModule(_module: string): Promise<Permission[]>;
  findActivePermissions(): Promise<Permission[]>;
}
