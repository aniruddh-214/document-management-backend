import bcrypt from 'bcryptjs';
import BcryptUtil from './bcrypt.util';

describe('BcryptUtil', () => {
  const plainPassword = 'mySecret123';

  describe('hashPassword', () => {
    it('should hash a valid password string', () => {
      const hash = BcryptUtil.hashPassword(plainPassword);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      // The hash should not be the same as the original password
      expect(hash).not.toBe(plainPassword);
    });

    it('should throw error if password is empty', () => {
      expect(() => BcryptUtil.hashPassword('')).toThrow(
        'Invalid password input',
      );
    });

    it('should throw error if password is not a string', () => {
      expect(() => BcryptUtil.hashPassword(null as any)).toThrow(
        'Invalid password input',
      );
      expect(() => BcryptUtil.hashPassword(undefined as any)).toThrow(
        'Invalid password input',
      );
      expect(() => BcryptUtil.hashPassword(123 as any)).toThrow(
        'Invalid password input',
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true when passwords match', () => {
      const hash = bcrypt.hashSync(plainPassword, 10);
      expect(BcryptUtil.comparePassword(plainPassword, hash)).toBe(true);
    });

    it('should return false when passwords do not match', () => {
      const hash = bcrypt.hashSync('someOtherPassword', 10);
      expect(BcryptUtil.comparePassword(plainPassword, hash)).toBe(false);
    });
  });
});
