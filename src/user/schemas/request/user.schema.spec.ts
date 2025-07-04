import { UsersSchema } from './user.schema';
import { DatabaseSortingOrder } from '../../../common/enums/dbOrderSort.enum';
import { USER_CONSTANTS } from '../../constants/user.constant';

const { VALIDATION_MESSAGES } = USER_CONSTANTS.REQUEST;

describe('UsersSchema Validation', () => {
  describe('getAllUsers.query', () => {
    const schema = UsersSchema.shape.getAllUsers.shape.query;
    it('should fail with invalid sortOrder and return custom error', () => {
      try {
        schema.parse({ sortOrder: 'INVALID' });
      } catch (e: any) {
        expect(e.errors).toBeDefined();
        expect(e.errors[0].path).toContain('sortOrder');
        expect(e.errors[0].message).toBe(
          USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.SORT_ORDER_INVALID,
        );
      }
    });

    it('should pass with all valid fields', () => {
      const result = schema.parse({
        fullName: 'John Doe',
        email: 'john@example.com',
        role: 'viewer,editor',
        isDeleted: 'false',
        page: '2',
        limit: '10',
        sortOrder: 'ASC',
        select: 'id,email,role',
      });

      expect(result.fullName).toBe('John Doe');
      expect(result.role).toEqual(['viewer', 'editor']);
      expect(result.isDeleted).toBe(false);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.sortOrder).toBe(DatabaseSortingOrder.ASC);
      expect(result.select).toEqual(['id', 'email', 'role']);
    });

    it('should default page, limit and sortOrder if not provided', () => {
      const result = schema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe(DatabaseSortingOrder.DESC);
    });

    it('should fail on too long fullName', () => {
      expect(() => schema.parse({ fullName: 'a'.repeat(51) })).toThrow(
        VALIDATION_MESSAGES.NAME_TOO_LONG,
      );
    });

    it('should fail on invalid role values', () => {
      expect(() => schema.parse({ role: 'admin,superadmin' })).toThrow(
        VALIDATION_MESSAGES.ROLES_INVALID,
      );
    });

    it('should fail if more than 2 roles are provided', () => {
      expect(() => schema.parse({ role: 'viewer,editor,another' })).toThrow(
        VALIDATION_MESSAGES.ROLES_INVALID,
      );
    });

    it('should fail with invalid select field', () => {
      expect(() => schema.parse({ select: 'id,invalidField' })).toThrow(
        VALIDATION_MESSAGES.SELECT_INVALID,
      );
    });

    it('should transform isDeleted correctly', () => {
      const result = schema.parse({ isDeleted: 'true' });
      expect(result.isDeleted).toBe(true);
    });
  });

  describe('getUser.param', () => {
    const schema = UsersSchema.shape.getUser.shape.param;

    it('should pass with valid UUID', () => {
      expect(() =>
        schema.parse({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      ).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      expect(() => schema.parse({ id: 'invalid-id' })).toThrow(
        VALIDATION_MESSAGES.INVALID_USER_ID,
      );
    });
  });

  describe('updateUserDetails', () => {
    const paramSchema = UsersSchema.shape.updateUserDetails.shape.param;
    const bodySchema = UsersSchema.shape.updateUserDetails.shape.body;

    it('should pass with valid UUID and role', () => {
      expect(() =>
        paramSchema.parse({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      ).not.toThrow();

      expect(() => bodySchema.parse({ role: 'viewer' })).not.toThrow();
    });

    it('should fail if role is ADMIN (disallowed)', () => {
      try {
        bodySchema.parse({ role: 'admin' });
      } catch (e: any) {
        expect(e.errors[0].message).toBe(
          "Invalid enum value. Expected 'editor' | 'viewer', received 'admin'",
        );
      }
    });

    it('should fail if role is UNKNOWN (disallowed)', () => {
      try {
        bodySchema.parse({ role: 'unknown' });
      } catch (e: any) {
        expect(e.errors[0].message).toBe(
          "Invalid enum value. Expected 'editor' | 'viewer', received 'unknown'",
        );
      }
    });
  });

  describe('deleteUser.param', () => {
    const schema = UsersSchema.shape.deleteUser.shape.param;

    it('should pass with valid UUID', () => {
      expect(() =>
        schema.parse({ id: '123e4567-e89b-12d3-a456-426614174000' }),
      ).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      expect(() => schema.parse({ id: 'invalid' })).toThrow(
        VALIDATION_MESSAGES.INVALID_USER_ID,
      );
    });
  });

  describe('getUserDocuments.query', () => {
    const schema = UsersSchema.shape.getUserDocuments.shape.query;

    it('should parse valid query with defaults', () => {
      const result = schema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe(DatabaseSortingOrder.DESC);
    });

    it('should fail with invalid page value', () => {
      expect(() => schema.parse({ page: '0' })).toThrow(
        VALIDATION_MESSAGES.PAGE_INVALID,
      );
    });

    it('should fail with invalid limit', () => {
      expect(() => schema.parse({ limit: '200' })).toThrow(
        VALIDATION_MESSAGES.LIMIT_INVALID,
      );
    });

    it('should fail with invalid sortOrder', () => {
      try {
        schema.parse({ sortOrder: 'INVALID' });
      } catch (e: any) {
        expect(e.errors).toBeDefined();
        expect(e.errors[0].path).toContain('sortOrder');
        expect(e.errors[0].message).toBe(
          VALIDATION_MESSAGES.SORT_ORDER_INVALID,
        );
      }
    });

    it('should fail with invalid id', () => {
      expect(() => schema.parse({ id: 'bad-id' })).toThrow(
        VALIDATION_MESSAGES.INVALID_USER_ID,
      );
    });
  });
});
