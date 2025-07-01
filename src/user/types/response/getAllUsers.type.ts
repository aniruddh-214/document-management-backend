import UserEntity from '../../entities/user.entity';

export type GetAllUsersResponseType = {
  data: UserEntity[];
  totalCount: number;
  totalPages: number;
};
