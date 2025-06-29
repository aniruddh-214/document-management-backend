import { JwtPayload } from 'jsonwebtoken';

export type CustomTokenPayload<T = object> = JwtPayload & T;
