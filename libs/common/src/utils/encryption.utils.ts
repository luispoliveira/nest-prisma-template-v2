import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

export class EncryptionUtils {
  static async encrypt(value: string, password: string): Promise<Buffer> {
    const iv = randomBytes(16);

    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;

    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedText = Buffer.concat([
      iv,
      cipher.update(value),
      cipher.final(),
    ]);

    return encryptedText;
  }

  static async decrypt(value: Buffer, password: string): Promise<string> {
    const iv = value.subarray(0, 16);

    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;

    const decipher = createDecipheriv('aes-256-ctr', key, iv);

    const decryptedText = Buffer.concat([
      decipher.update(value.subarray(16)),
      decipher.final(),
    ]);

    return decryptedText.toString();
  }
}
