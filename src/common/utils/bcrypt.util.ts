import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export default class BcryptUtil {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(
    plainText: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
