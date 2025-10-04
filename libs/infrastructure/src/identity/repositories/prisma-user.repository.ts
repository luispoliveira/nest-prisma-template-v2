import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lib/prisma';
import { User, UserRepository, Email, Password } from '@lib/domain';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    const userData = await this._prisma.user.findUnique({
      where: { id },
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this._prisma.user.findUnique({
      where: { email: email.email },
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findActiveUsers(): Promise<User[]> {
    const usersData = await this._prisma.user.findMany({
      where: { isActive: true },
    });

    return usersData.map(userData => this.toDomain(userData));
  }

  async findByActivationToken(token: string): Promise<User | null> {
    const userData = await this._prisma.user.findUnique({
      where: { activationToken: token },
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    const userData = await this._prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!userData) {
      return null;
    }

    return this.toDomain(userData);
  }

  async findAll(): Promise<User[]> {
    const usersData = await this._prisma.user.findMany();
    return usersData.map(userData => this.toDomain(userData));
  }

  async save(user: User): Promise<User> {
    const userPersistence = user.toPersistence();

    const savedUser = await this._prisma.user.create({
      data: {
        email: userPersistence.email,
        password: userPersistence.password,
        isActive: userPersistence.isActive,
        activationToken: userPersistence.activationToken,
        activationTokenExpiresAt: userPersistence.activationTokenExpiresAt,
        resetPasswordToken: userPersistence.resetPasswordToken,
        resetPasswordTokenExpiresAt:
          userPersistence.resetPasswordTokenExpiresAt,
        lastLogin: userPersistence.lastLogin,
        hasTwoFA: userPersistence.hasTwoFA,
        twoFAPhoneNumber: userPersistence.twoFAPhoneNumber,
        twoFAPPhoneVerified: userPersistence.twoFAPPhoneVerified,
        roleId: userPersistence.roleId,
        activatedAt: userPersistence.activatedAt,
        activatedBy: userPersistence.activatedBy,
        deactivatedAt: userPersistence.deactivatedAt,
        deactivatedBy: userPersistence.deactivatedBy,
      },
    });

    return this.toDomain(savedUser);
  }

  async update(user: User): Promise<User> {
    const userPersistence = user.toPersistence();

    const updatedUser = await this._prisma.user.update({
      where: { id: user.id },
      data: {
        email: userPersistence.email,
        password: userPersistence.password,
        isActive: userPersistence.isActive,
        activationToken: userPersistence.activationToken,
        activationTokenExpiresAt: userPersistence.activationTokenExpiresAt,
        resetPasswordToken: userPersistence.resetPasswordToken,
        resetPasswordTokenExpiresAt:
          userPersistence.resetPasswordTokenExpiresAt,
        lastLogin: userPersistence.lastLogin,
        hasTwoFA: userPersistence.hasTwoFA,
        twoFAPhoneNumber: userPersistence.twoFAPhoneNumber,
        twoFAPPhoneVerified: userPersistence.twoFAPPhoneVerified,
        roleId: userPersistence.roleId,
        activatedAt: userPersistence.activatedAt,
        activatedBy: userPersistence.activatedBy,
        deactivatedAt: userPersistence.deactivatedAt,
        deactivatedBy: userPersistence.deactivatedBy,
      },
    });

    return this.toDomain(updatedUser);
  }

  async delete(id: number): Promise<void> {
    await this._prisma.user.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const user = await this._prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  private toDomain(userData: any): User {
    const email = Email.create(userData.email);
    const password = userData.password
      ? Password.fromHash(userData.password)
      : undefined;

    return User.fromPersistence({
      id: userData.id,
      email,
      password,
      isActive: userData.isActive,
      activationToken: userData.activationToken,
      activationTokenExpiresAt: userData.activationTokenExpiresAt,
      resetPasswordToken: userData.resetPasswordToken,
      resetPasswordTokenExpiresAt: userData.resetPasswordTokenExpiresAt,
      lastLogin: userData.lastLogin,
      hasTwoFA: userData.hasTwoFA,
      twoFAPhoneNumber: userData.twoFAPhoneNumber,
      twoFAPPhoneVerified: userData.twoFAPPhoneVerified,
      roleId: userData.roleId,
      activatedAt: userData.activatedAt,
      activatedBy: userData.activatedBy,
      deactivatedAt: userData.deactivatedAt,
      deactivatedBy: userData.deactivatedBy,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }
}
