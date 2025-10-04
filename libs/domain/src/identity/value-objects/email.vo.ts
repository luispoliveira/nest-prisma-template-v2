import { ValueObject } from '../../shared/value-object';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(email: string): Email {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    return new Email({ value: email.toLowerCase().trim() });
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get email(): string {
    return this._props.value;
  }
}
