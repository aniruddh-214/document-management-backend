import { JwtPayload } from 'jsonwebtoken';

import UserRoleEnum from '../../common/enums/role.enum';

export type UserAuthTokenPayload = JwtPayload & {
  sub: string;
  role: UserRoleEnum;
};
