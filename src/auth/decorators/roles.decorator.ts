import { CustomDecorator, SetMetadata } from '@nestjs/common';

import UserRoleEnum from '../../common/enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleEnum[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roles);
