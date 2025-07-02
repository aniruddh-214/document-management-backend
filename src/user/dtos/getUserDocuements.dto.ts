import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { GetUserDocumentsRequestQueryType } from '../schemas/request/user.schema';

export default class GetUserDocumentsDTO {
  public id?: string;
  public limit = 20;
  public page = 1;
  public order = DatabaseSortingOrder.DESC;
  public needToIncludeFilePath = false;

  constructor(query: GetUserDocumentsRequestQueryType) {
    this.id = query.id;
    this.limit = query.limit;
    this.page = query.page;
    this.order = query.sortOrder;
  }
}
