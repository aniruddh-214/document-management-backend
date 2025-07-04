import { DatabaseSortingOrder } from '../../common/enums/dbOrderSort.enum';
import { validRoles } from '../constants/user.constant';
import UserEntity from '../entities/user.entity';
import { GetAllUSersRequestQueryType } from '../schemas/request/user.schema';

export default class GetAllUsersDto {
  public select: Array<keyof UserEntity> = ['id', 'fullName', 'email', 'role'];
  public fullName?: string;
  public email?: string;
  public role?: Array<(typeof validRoles)[number]>;

  public isDeleted?: boolean;

  public page = 1;
  public limit = 20;

  public sortOrder: DatabaseSortingOrder = DatabaseSortingOrder.DESC;

  public constructor(query: GetAllUSersRequestQueryType) {
    const { select, fullName, email, role, isDeleted, page, limit, sortOrder } =
      query;

    if (select?.length) {
      this.select = select;
    }

    this.fullName = fullName;
    this.email = email;
    this.role = role as Array<(typeof validRoles)[number]>;

    this.isDeleted = isDeleted;

    if (page) {
      this.page = page;
    }
    if (limit) {
      this.limit = limit;
    }
    this.sortOrder = sortOrder;
  }
}
