import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { DocumentEntity } from '../entities/document.entity';
import { GetAllDocumentsRequestQueryType } from '../schemas/request/document.schema';

export default class GetAllDocumentsDto {
  public select: Array<keyof DocumentEntity> = [
    'id',
    'title',
    'description',
    'fileName',
    'mimeType',
    'size',
  ];

  public title?: string;
  public mimeType?: string;

  public isDeleted?: boolean;

  public sortOrder: DatabaseSortingOrder = DatabaseSortingOrder.DESC;

  public page = 1;
  public limit = 20;

  public constructor(query: GetAllDocumentsRequestQueryType) {
    const { select, title, mimeType, isDeleted, page, limit, sortOrder } =
      query;

    if (select?.length) {
      this.select = select;
    }

    this.title = title;
    this.mimeType = mimeType;

    this.isDeleted = isDeleted;

    this.page = page ?? this.page;
    this.limit = limit ?? this.limit;
    this.sortOrder = sortOrder ?? this.sortOrder;
  }
}
