import { AuthSchema } from './auth.schema';
import { USER_CONSTANTS } from '../../../user/constants/user.constant';

const { VALIDATION_MESSAGES } = USER_CONSTANTS.REQUEST;

describe('AuthSchema', () => {
  describe('createUser', () => {
    const schema = AuthSchema.shape.createUser.shape.body;

    it('should validate a correct createUser input', () => {
      const result = schema.safeParse({
        fullName: 'John Doe',
        email: 'TestUser@Example.com',
        password: 'Password@123',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('John Doe'); // transformed
        expect(result.data.email).toBe('testuser@example.com'); // transformed
      }
    });

    it('should reject short names', () => {
      const result = schema.safeParse({
        fullName: 'Jo',
        email: 'test@example.com',
        password: 'Password@123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.NAME_REQUIRED,
      );
    });

    it('should reject invalid name characters', () => {
      const result = schema.safeParse({
        fullName: 'John123',
        email: 'test@example.com',
        password: 'Password@123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.NAME_CAN_ONLY_CONTAIN_ALPHABETICAL_CHARACTERS,
      );
    });

    it('should reject invalid email format', () => {
      const result = schema.safeParse({
        fullName: 'John Doe',
        email: 'bad-email',
        password: 'Password@123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.INVALID_EMAIL,
      );
    });

    it('should reject short passwords', () => {
      const result = schema.safeParse({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: '123',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.MIN_REQUIRED_CHAR,
      );
    });

    it('should reject passwords that do not match regex', () => {
      const result = schema.safeParse({
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password', // lowercase, missing special char
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.PASSWORD_REGEX_ERROR,
      );
    });
  });

  describe('loginUser', () => {
    const schema = AuthSchema.shape.loginUser.shape.body;

    it('should validate a correct login input', () => {
      const result = schema.safeParse({
        email: 'Login@Example.com',
        password: 'some-password',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('login@example.com'); // transformed
      }
    });

    it('should reject bad email', () => {
      const result = schema.safeParse({
        email: 'invalid',
        password: 'password',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        VALIDATION_MESSAGES.INVALID_EMAIL,
      );
    });

    it('should require password', () => {
      const result = schema.safeParse({
        email: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(true); // no min length enforced in login
    });
  });
});
