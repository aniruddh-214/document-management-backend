// src/common/utils/bcrypt.util.ts
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export default class BcryptUtil {
  static hashPassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password input');
    }

    return bcrypt.hashSync(password, SALT_ROUNDS);
  }

  static comparePassword(plainText: string, hash: string): boolean {
    return bcrypt.compareSync(plainText, hash);
  }
}
