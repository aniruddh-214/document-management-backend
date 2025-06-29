import UserRoleEnum from '../../../common/enums/role.enum';

export type CreateUserResponseType = {
  id: string;
  role: UserRoleEnum;
};
