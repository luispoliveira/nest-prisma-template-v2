import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Permission, PermissionRepository } from '@lib/domain';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async findById(id: number): Promise<Permission | null> {
    const permissionData = await this._prisma.permission.findUnique({
      where: { id },
    });

    if (!permissionData) {
      return null;
    }

    return this.toDomain(permissionData);
  }

  async findByName(name: string): Promise<Permission | null> {
    const permissionData = await this._prisma.permission.findUnique({
      where: { name },
    });

    if (!permissionData) {
      return null;
    }

    return this.toDomain(permissionData);
  }

  async findByModule(module: string): Promise<Permission[]> {
    const permissionsData = await this._prisma.permission.findMany({
      where: { module },
    });

    return permissionsData.map(data => this.toDomain(data));
  }

  async findActivePermissions(): Promise<Permission[]> {
    const permissionsData = await this._prisma.permission.findMany({
      where: { isActive: true },
    });

    return permissionsData.map(data => this.toDomain(data));
  }

  async findAll(): Promise<Permission[]> {
    const permissionsData = await this._prisma.permission.findMany();
    return permissionsData.map(data => this.toDomain(data));
  }

  async save(permission: Permission): Promise<Permission> {
    const permissionPersistence = permission.toPersistence();

    const savedPermission = await this._prisma.permission.create({
      data: {
        name: permissionPersistence.name,
        module: permissionPersistence.module,
        isActive: permissionPersistence.isActive,
      },
    });

    return this.toDomain(savedPermission);
  }

  async update(permission: Permission): Promise<Permission> {
    const permissionPersistence = permission.toPersistence();

    const updatedPermission = await this._prisma.permission.update({
      where: { id: permission.id },
      data: {
        name: permissionPersistence.name,
        module: permissionPersistence.module,
        isActive: permissionPersistence.isActive,
      },
    });

    return this.toDomain(updatedPermission);
  }

  async delete(id: number): Promise<void> {
    await this._prisma.permission.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const permission = await this._prisma.permission.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!permission;
  }

  private toDomain(permissionData: any): Permission {
    return Permission.fromPersistence({
      id: permissionData.id,
      name: permissionData.name,
      module: permissionData.module,
      isActive: permissionData.isActive,
      createdAt: permissionData.createdAt,
      updatedAt: permissionData.updatedAt,
    });
  }
}
