import { ValueObject } from '../../shared/value-object';

interface PasswordProps {
  hashedValue: string;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  public static fromHash(hashedPassword: string): Password {
    return new Password({ hashedValue: hashedPassword });
  }

  public static async create(plainPassword: string): Promise<Password> {
    if (!this.isValidPassword(plainPassword)) {
      throw new Error('Password does not meet security requirements');
    }
    // Hash logic would be here - for now just simulate
    const hashedValue = await this.hashPassword(plainPassword);
    return new Password({ hashedValue });
  }

  private static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private static async hashPassword(password: string): Promise<string> {
    // This would use bcrypt or similar - placeholder for now
    return `hashed_${password}`;
  }

  get hashedValue(): string {
    return this._props.hashedValue;
  }
}
