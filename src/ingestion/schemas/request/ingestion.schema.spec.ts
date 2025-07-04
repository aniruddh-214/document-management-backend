import { z } from 'zod';
import { IngestionSchema } from './ingestion.schema';
import { DatabaseSortingOrder } from '../../../common/enums/dbOrderSort.enum';
import { INGESTION_CONSTANTS } from '../../constants/ingestion.constant';
import { USER_CONSTANTS } from '../../../user/constants/user.constant';
import IngestionStatusEnum from '../../enums/ingestion.enum';

describe('IngestionSchema Validation', () => {
  // Helper valid UUID for tests
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  describe('triggerIngestion param', () => {
    const schema = IngestionSchema.shape.triggerIngestion.shape.param;

    it('should pass with valid UUID', () => {
      expect(() => schema.parse({ id: validUUID })).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      expect(() => schema.parse({ id: 'invalid-uuid' })).toThrow(
        'Invalid Document ID',
      );
    });
  });

  describe('getIngestionDetails param', () => {
    const schema = IngestionSchema.shape.getIngestionDetails.shape.param;

    it('should pass with valid UUID', () => {
      expect(() => schema.parse({ id: validUUID })).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      expect(() => schema.parse({ id: 'bad-uuid' })).toThrow(
        'Invalid Ingestion ID',
      );
    });
  });

  describe('deleteIngestion param', () => {
    const schema = IngestionSchema.shape.deleteIngestion.shape.param;

    it('should pass with valid UUID', () => {
      expect(() => schema.parse({ id: validUUID })).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      expect(() => schema.parse({ id: 'bad-uuid' })).toThrow(
        'Invalid Ingestion ID',
      );
    });
  });

  describe('getAllIngestions query', () => {
    const schema = IngestionSchema.shape.getAllIngestions.shape.query;

    it('should pass with valid optional UUID fields', () => {
      expect(() =>
        schema.parse({
          id: validUUID,
          documentId: validUUID,
          userId: validUUID,
        }),
      ).not.toThrow();
    });

    it('should fail if id is invalid UUID', () => {
      expect(() => schema.parse({ id: 'invalid-uuid' })).toThrow(
        INGESTION_CONSTANTS.ZOD.INVALID_INGESTION_ID,
      );
    });

    it('should fail if documentId is invalid UUID', () => {
      expect(() => schema.parse({ documentId: 'invalid' })).toThrow(
        INGESTION_CONSTANTS.ZOD.INVALID_DOCUMENT_ID,
      );
    });

    it('should fail if userId is invalid UUID', () => {
      expect(() => schema.parse({ userId: 'invalid' })).toThrow(
        INGESTION_CONSTANTS.ZOD.INVALID_USER_ID,
      );
    });

    it('should parse and validate status string array', () => {
      const validStatuses = `${IngestionStatusEnum.COMPLETED},${IngestionStatusEnum.FAILED}`;
      const parsed = schema.parse({ status: validStatuses });
      expect(parsed.status).toEqual([
        IngestionStatusEnum.COMPLETED,
        IngestionStatusEnum.FAILED,
      ]);
    });

    it('should fail if status contains invalid values', () => {
      expect(() => schema.parse({ status: 'invalidStatus' })).toThrow(
        INGESTION_CONSTANTS.ZOD.INVALID_STATUS,
      );
    });

    it.each(['hasLogs', 'hasError', 'isDeleted'] as const)(
      'should convert string boolean %s to boolean',
      (field) => {
        const parsedTrue = schema.parse({ [field]: 'true' });
        expect(parsedTrue[field]).toBe(true);
        const parsedFalse = schema.parse({ [field]: 'false' });
        expect(parsedFalse[field]).toBe(false);
      },
    );

    it.each(['hasLogs', 'hasError', 'isDeleted'] as const)(
      'should fail if %s is empty string',
      (field) => {
        expect(() => schema.parse({ [field]: '' })).toThrow(
          INGESTION_CONSTANTS.ZOD.INVALID_INPUT,
        );
      },
    );

    it('should parse valid page and limit', () => {
      const parsed = schema.parse({ page: '2', limit: '50' });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(50);
    });

    it('should fail if page is less than 1', () => {
      expect(() => schema.parse({ page: '0' })).toThrow(
        USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.PAGE_INVALID,
      );
    });

    it('should fail if limit is less than 1', () => {
      expect(() => schema.parse({ limit: '0' })).toThrow(
        USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.LIMIT_INVALID,
      );
    });

    it('should fail if limit is more than 100', () => {
      expect(() => schema.parse({ limit: '101' })).toThrow(
        USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.LIMIT_INVALID,
      );
    });

    it('should default sortOrder to DESC', () => {
      const parsed = schema.parse({});
      expect(parsed.sortOrder).toBe(DatabaseSortingOrder.DESC);
    });

    it('should accept valid sortOrder ASC', () => {
      const parsed = schema.parse({ sortOrder: DatabaseSortingOrder.ASC });
      expect(parsed.sortOrder).toBe(DatabaseSortingOrder.ASC);
    });

    it('should fail with invalid sortOrder', () => {
      try {
        schema.parse({ sortOrder: 'invalid' });
      } catch (e: any) {
        expect(e.errors[0].message).toBe(
          USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.SORT_ORDER_INVALID,
        );
      }
    });

    it('should parse select string to array and validate keys', () => {
      const validSelect = 'id,status,logs';
      const parsed = schema.parse({ select: validSelect });
      expect(parsed.select).toEqual(['id', 'status', 'logs']);
    });

    it('should fail if select contains invalid keys', () => {
      expect(() => schema.parse({ select: 'id,invalidField' })).toThrow(
        INGESTION_CONSTANTS.ZOD.INVALID_INPUT,
      );
    });

    it('should allow select to be undefined', () => {
      const parsed = schema.parse({});
      expect(parsed.select).toBeUndefined();
    });
  });
});
