import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import IngestionStatusEnum from '../enums/ingestion.enum';
import GetAllIngestionsDto from './getAllIngestions.dto';

describe('GetAllIngestionsDto', () => {
  it('should set default values if query is empty', () => {
    const dto = new GetAllIngestionsDto({} as any);

    expect(dto.select).toEqual([
      'id',
      'status',
      'logs',
      'errorMessage',
      'documentId',
      'userId',
      'createdAt',
      'updatedAt',
    ]);
    expect(dto.id).toBeUndefined();
    expect(dto.documentId).toBeUndefined();
    expect(dto.userId).toBeUndefined();
    expect(dto.status).toBeUndefined();
    expect(dto.isDeleted).toBeUndefined();
    expect(dto.hasLogs).toBeUndefined();
    expect(dto.hasError).toBeUndefined();
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.DESC);
  });

  it('should override select if provided', () => {
    const dto = new GetAllIngestionsDto({
      select: ['id', 'userId'],
    } as any);

    expect(dto.select).toEqual(['id', 'userId']);
  });

  it('should set all provided fields correctly', () => {
    const query = {
      select: ['status', 'logs'],
      id: 'some-id',
      documentId: 'doc-123',
      userId: 'user-456',
      status: [IngestionStatusEnum.COMPLETED, IngestionStatusEnum.FAILED],
      isDeleted: true,
      hasLogs: false,
      hasError: true,
      page: 3,
      limit: 50,
      sortOrder: DatabaseSortingOrder.ASC,
    };

    const dto = new GetAllIngestionsDto(query as any);

    expect(dto.select).toEqual(['status', 'logs']);
    expect(dto.id).toBe('some-id');
    expect(dto.documentId).toBe('doc-123');
    expect(dto.userId).toBe('user-456');
    expect(dto.status).toEqual([
      IngestionStatusEnum.COMPLETED,
      IngestionStatusEnum.FAILED,
    ]);
    expect(dto.isDeleted).toBe(true);
    expect(dto.hasLogs).toBe(false);
    expect(dto.hasError).toBe(true);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.ASC);
  });

  it('should use default page, limit, sortOrder if not provided', () => {
    const dto = new GetAllIngestionsDto({
      id: 'id-123',
      status: [IngestionStatusEnum.QUEUED],
    } as any);

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortOrder).toBe(DatabaseSortingOrder.DESC);
  });
});
