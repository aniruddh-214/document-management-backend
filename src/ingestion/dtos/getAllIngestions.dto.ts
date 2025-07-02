import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { IngestionEntity } from '../entities/ingestion.entity';
import IngestionStatusEnum from '../enums/ingestion.enum';
import { GetAllIngestionsRequestQueryType } from '../schemas/request/ingestion.schema';

export default class GetAllIngestionsDto {
  public select: Array<keyof IngestionEntity> = [
    'id',
    'status',
    'logs',
    'errorMessage',
    'documentId',
    'userId',
    'createdAt',
    'updatedAt',
  ];

  public id?: string;
  public documentId?: string;
  public userId?: string;
  public status?: IngestionStatusEnum[];

  public isActive?: boolean;
  public isDeleted?: boolean;

  public hasLogs?: boolean;
  public hasError?: boolean;

  public createdFrom?: string;
  public createdTo?: string;

  public sortOrder: DatabaseSortingOrder = DatabaseSortingOrder.DESC;
  public page = 1;
  public limit = 20;

  constructor(query: GetAllIngestionsRequestQueryType) {
    const {
      select,
      id,
      documentId,
      userId,
      status,
      isDeleted,
      hasLogs,
      hasError,
      page,
      limit,
      sortOrder,
    } = query;

    if (select?.length) {
      this.select = select;
    }

    this.id = id;
    this.documentId = documentId;
    this.userId = userId;
    this.status = status;

    this.isDeleted = isDeleted;

    this.hasLogs = hasLogs;
    this.hasError = hasError;

    this.page = page ?? this.page;
    this.limit = limit ?? this.limit;
    this.sortOrder = sortOrder ?? this.sortOrder;
  }
}
