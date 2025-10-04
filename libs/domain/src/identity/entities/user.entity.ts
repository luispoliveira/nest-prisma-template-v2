import { AggregateRoot } from '../../shared/aggregate-root';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserActivatedEvent } from '../events/user-activated.event';

export interface UserProps {
  id: number;
  email: Email;
  password?: Password;
  isActive: boolean;
  activationToken?: string;
  activationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiresAt?: Date;
  lastLogin?: Date;
  hasTwoFA: boolean;
  twoFAPhoneNumber?: string;
  twoFAPPhoneVerified: boolean;
  roleId?: number;
  activatedAt?: Date;
  activatedBy?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot {
  private constructor(private readonly props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
  }

  public static create(
    props: Omit<
      UserProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'isActive'
      | 'hasTwoFA'
      | 'twoFAPPhoneVerified'
    >,
  ): User {
    const now = new Date();
    const userProps: UserProps = {
      ...props,
      id: 0, // Will be set by repository
      isActive: false,
      hasTwoFA: false,
      twoFAPPhoneVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    const user = new User(userProps);
    user.addDomainEvent(new UserCreatedEvent(user.id, user.email.email));
    return user;
  }

  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  public activate(activatedBy: string): void {
    if (this.props.isActive) {
      throw new Error('User is already active');
    }

    this.props.isActive = true;
    this.props.activatedAt = new Date();
    this.props.activatedBy = activatedBy;
    this.props.activationToken = undefined;
    this.props.activationTokenExpiresAt = undefined;

    this.addDomainEvent(new UserActivatedEvent(this.id, this.email.email));
  }

  public deactivate(deactivatedBy: string): void {
    if (!this.props.isActive) {
      throw new Error('User is already inactive');
    }

    this.props.isActive = false;
    this.props.deactivatedAt = new Date();
    this.props.deactivatedBy = deactivatedBy;
  }

  public changePassword(newPassword: Password): void {
    this.props.password = newPassword;
    this.props.resetPasswordToken = undefined;
    this.props.resetPasswordTokenExpiresAt = undefined;
  }

  public enableTwoFA(phoneNumber: string): void {
    this.props.hasTwoFA = true;
    this.props.twoFAPhoneNumber = phoneNumber;
    this.props.twoFAPPhoneVerified = false;
  }

  public verifyPhoneNumber(): void {
    this.props.twoFAPPhoneVerified = true;
  }

  public recordLogin(): void {
    this.props.lastLogin = new Date();
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password | undefined {
    return this.props.password;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get hasTwoFA(): boolean {
    return this.props.hasTwoFA;
  }

  get roleId(): number | undefined {
    return this.props.roleId;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  public toPersistence(): Record<string, any> {
    return {
      id: this.props.id,
      email: this.props.email.email,
      password: this.props.password?.hashedValue,
      isActive: this.props.isActive,
      activationToken: this.props.activationToken,
      activationTokenExpiresAt: this.props.activationTokenExpiresAt,
      resetPasswordToken: this.props.resetPasswordToken,
      resetPasswordTokenExpiresAt: this.props.resetPasswordTokenExpiresAt,
      lastLogin: this.props.lastLogin,
      hasTwoFA: this.props.hasTwoFA,
      twoFAPhoneNumber: this.props.twoFAPhoneNumber,
      twoFAPPhoneVerified: this.props.twoFAPPhoneVerified,
      roleId: this.props.roleId,
      activatedAt: this.props.activatedAt,
      activatedBy: this.props.activatedBy,
      deactivatedAt: this.props.deactivatedAt,
      deactivatedBy: this.props.deactivatedBy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
