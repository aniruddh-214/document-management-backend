import UserRoleEnum from '../../common/enums/role.enum';

export interface BaseJwtPayload {
  sub: string | number;
  iat?: number;
  exp?: number;
}

export type CustomTokenPayload<T = Record<string, any>> = BaseJwtPayload & T;

export type UserAuthTokenPayload = CustomTokenPayload & {
  id: number;
  role: UserRoleEnum;
};
