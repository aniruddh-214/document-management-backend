import UserEntity from '../../entities/user.entity';

export type GetAllUsersResponseType = {
  data: UserEntity[];
  total: number;
};
