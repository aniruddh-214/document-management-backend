import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { DocumentEntity } from '../entities/document.entity';
import DocumentStatusEnum from '../enums/documentStatus.enum';
import { GetAllDocumentsRequestQueryType } from '../schemas/request/document.schema';

export default class GetAllDocumentsDto {
  public select: Array<keyof DocumentEntity> = [
    'id',
    'title',
    'description',
    'fileName',
    'mimeType',
    'documentStatus',
    'size',
  ];

  public title?: string;
  public mimeType?: string;
  public documentStatus?: DocumentStatusEnum[];

  public isActive?: boolean;
  public isDeleted?: boolean;

  public sortOrder: DatabaseSortingOrder = DatabaseSortingOrder.DESC;

  public page = 1;
  public limit = 20;

  public constructor(query: GetAllDocumentsRequestQueryType) {
    const {
      select,
      title,
      mimeType,
      documentStatus,
      isActive,
      isDeleted,
      page,
      limit,
      sortOrder,
    } = query;

    if (select?.length) {
      this.select = select;
    }

    this.title = title;
    this.mimeType = mimeType;
    this.documentStatus = documentStatus as DocumentStatusEnum[];

    this.isActive = isActive;
    this.isDeleted = isDeleted;

    this.page = page ?? this.page;
    this.limit = limit ?? this.limit;
    this.sortOrder = sortOrder ?? this.sortOrder;
  }
}
