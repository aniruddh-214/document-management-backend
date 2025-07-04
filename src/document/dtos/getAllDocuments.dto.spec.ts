import GetAllDocumentsDto from './getAllDocuments.dto';
import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';

describe('GetAllDocumentsDto', () => {
  it('should set default values when no query provided', () => {
    const dto = new GetAllDocumentsDto({} as any);

    expect(dto.select).toEqual([
      'id',
      'title',
      'description',
      'fileName',
      'mimeType',
      'size',
    ]);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.DESC);
    expect(dto.title).toBeUndefined();
    expect(dto.mimeType).toBeUndefined();
    expect(dto.isDeleted).toBeUndefined();
  });

  it('should override select fields if provided', () => {
    const dto = new GetAllDocumentsDto({
      select: ['id', 'title'],
    } as any);

    expect(dto.select).toEqual(['id', 'title']);
  });

  it('should set optional filters if provided', () => {
    const dto = new GetAllDocumentsDto({
      title: 'Test Title',
      mimeType: 'application/pdf',
      isDeleted: true,
    } as any);

    expect(dto.title).toBe('Test Title');
    expect(dto.mimeType).toBe('application/pdf');
    expect(dto.isDeleted).toBe(true);
  });

  it('should override pagination and sorting when provided', () => {
    const dto = new GetAllDocumentsDto({
      page: 3,
      limit: 50,
      sortOrder: DatabaseSortingOrder.ASC,
    } as any);

    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.ASC);
  });

  it('should fallback to defaults for undefined/null page, limit, sortOrder', () => {
    const dto = new GetAllDocumentsDto({
      page: null,
      limit: undefined,
      sortOrder: null,
    } as any);

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.DESC);
  });
});
