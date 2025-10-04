import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { Role, RoleRepository } from '@lib/domain';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async findById(id: number): Promise<Role | null> {
    const roleData = await this._prisma.role.findUnique({
      where: { id },
    });

    if (!roleData) {
      return null;
    }

    return this.toDomain(roleData);
  }

  async findByName(name: string): Promise<Role | null> {
    const roleData = await this._prisma.role.findUnique({
      where: { name },
    });

    if (!roleData) {
      return null;
    }

    return this.toDomain(roleData);
  }

  async findActiveRoles(): Promise<Role[]> {
    const rolesData = await this._prisma.role.findMany({
      where: { isActive: true },
    });

    return rolesData.map(roleData => this.toDomain(roleData));
  }

  async findAll(): Promise<Role[]> {
    const rolesData = await this._prisma.role.findMany();
    return rolesData.map(roleData => this.toDomain(roleData));
  }

  async save(role: Role): Promise<Role> {
    const rolePersistence = role.toPersistence();

    const savedRole = await this._prisma.role.create({
      data: {
        name: rolePersistence.name,
        isActive: rolePersistence.isActive,
      },
    });

    return this.toDomain(savedRole);
  }

  async update(role: Role): Promise<Role> {
    const rolePersistence = role.toPersistence();

    const updatedRole = await this._prisma.role.update({
      where: { id: role.id },
      data: {
        name: rolePersistence.name,
        isActive: rolePersistence.isActive,
      },
    });

    return this.toDomain(updatedRole);
  }

  async delete(id: number): Promise<void> {
    await this._prisma.role.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const role = await this._prisma.role.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!role;
  }

  private toDomain(roleData: any): Role {
    return Role.fromPersistence({
      id: roleData.id,
      name: roleData.name,
      isActive: roleData.isActive,
      createdAt: roleData.createdAt,
      updatedAt: roleData.updatedAt,
    });
  }
}
