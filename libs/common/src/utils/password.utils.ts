import * as bcrypt from 'bcrypt';
export class PasswordUtil {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(
    hashedPassword: string,
    password: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generatePassword(length = 8): string {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }
}
