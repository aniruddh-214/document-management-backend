import { DocumentSchema } from './document.schema';
import { DatabaseSortingOrder } from '../../../common/enums/dbOrderSort.enum';
import { DOCUMENT_CONSTANTS } from '../../constants/document.constant';
import { USER_CONSTANTS } from '../../../user/constants/user.constant';

describe('DocumentSchema Validation', () => {
  describe('uploadDocument', () => {
    const schema = DocumentSchema.shape.uploadDocument.shape.body;

    it('should pass with valid title', () => {
      expect(() =>
        schema.parse({ title: 'My Doc', description: 'Desc' }),
      ).not.toThrow();
    });

    it('should fail if title is missing', () => {
      try {
        schema.parse({});
        fail('Expected validation error for missing title');
      } catch (err: any) {
        expect(err.errors[0].message).toBe('Required');
        expect(err.errors[0].path).toEqual(['title']);
      }
    });
  });

  describe('updateDocument', () => {
    const schema = DocumentSchema.shape.updateDocument;

    it('should pass with valid UUID and body', () => {
      expect(() =>
        schema.parse({
          param: { id: '123e4567-e89b-12d3-a456-426614174000' },
          body: { title: 'Updated Title' },
        }),
      ).not.toThrow();
    });

    it('should fail with invalid UUID', () => {
      try {
        schema.parse({ param: { id: 'invalid' }, body: {} });
        fail('Expected validation error for invalid UUID');
      } catch (err: any) {
        expect(err.errors[0].message).toBe(
          DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID,
        );
        expect(err.errors[0].path).toEqual(['param', 'id']);
      }
    });
  });

  describe.each([['downloadDocument'], ['getDocument'], ['deleteDocument']])(
    '%s',
    (key) => {
      const schema = DocumentSchema.shape[key].shape.param;

      it('should pass with valid UUID', () => {
        expect(() =>
          schema.parse({ id: '123e4567-e89b-12d3-a456-426614174000' }),
        ).not.toThrow();
      });

      it('should fail with invalid UUID', () => {
        try {
          schema.parse({ id: 'invalid-uuid' });
          fail('Expected validation error for invalid UUID');
        } catch (err: any) {
          expect(err.errors[0].message).toBe(
            DOCUMENT_CONSTANTS.ZOD.INVALID_DOCUMENT_ID,
          );
          expect(err.errors[0].path).toEqual(['id']);
        }
      });
    },
  );

  describe('getAllDocuments', () => {
    const schema = DocumentSchema.shape.getAllDocuments.shape.query;

    it('should pass with valid optional fields', () => {
      const parsed = schema.parse({
        title: 'Test',
        mimeType: 'application/pdf',
        isDeleted: 'true',
        page: '2',
        limit: '10',
        sortOrder: 'ASC',
        select: 'id,title,size',
      });

      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(10);
      expect(parsed.isDeleted).toBe(true);
      expect(parsed.select).toEqual(['id', 'title', 'size']);
    });

    it('should fail with invalid page number', () => {
      try {
        schema.parse({ page: '0' });
        fail('Expected validation error for invalid page');
      } catch (err: any) {
        expect(err.errors[0].message).toBe(
          USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.PAGE_INVALID,
        );
        expect(err.errors[0].path).toEqual(['page']);
      }
    });

    it('should default sortOrder to DESC if not provided', () => {
      const parsed = schema.parse({});
      expect(parsed.sortOrder).toBe(DatabaseSortingOrder.DESC);
    });

    it('should fail with invalid field in select', () => {
      try {
        schema.parse({ select: 'id,unknownField' });
        fail('Expected validation error for invalid select field');
      } catch (err: any) {
        expect(err.errors[0].message).toBe(
          DOCUMENT_CONSTANTS.ZOD.INVALID_INPUT,
        );
        expect(err.errors[0].path).toEqual(['select']);
      }
    });

    it('should transform string boolean correctly', () => {
      const parsed = schema.parse({ isDeleted: 'false' });
      expect(parsed.isDeleted).toBe(false);
    });

    it('should fail with invalid sortOrder value', () => {
      const schema = DocumentSchema.shape.getAllDocuments;

      try {
        schema.parse({ query: { sortOrder: 'INVALID_SORT_ORDER' } });
        fail('Expected validation error for invalid sortOrder');
      } catch (err: any) {
        expect(err.errors).toBeDefined();
        expect(err.errors[0].path).toContain('sortOrder');
        expect(err.errors[0].message).toBe(
          USER_CONSTANTS.REQUEST.VALIDATION_MESSAGES.SORT_ORDER_INVALID,
        );
      }
    });
  });
});
