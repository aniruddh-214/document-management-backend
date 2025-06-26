import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

import { CustomTokenPayload } from '../types/jwtPayload.interface';

@Injectable()
export class JwtTokenService<
  T extends Record<string, any> = Record<string, any>,
> {
  constructor(private readonly jwtService: JwtService) {}

  signPayload(
    payload: CustomTokenPayload<T>,
    options?: JwtSignOptions,
  ): string {
    return this.jwtService.sign(payload, options);
  }

  async signPayloadAsync(
    payload: CustomTokenPayload<T>,
    options?: JwtSignOptions,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, options);
  }

  verifyToken(token: string): CustomTokenPayload<T> {
    return this.jwtService.verify<CustomTokenPayload<T>>(token);
  }

  async verifyTokenAsync(token: string): Promise<CustomTokenPayload<T>> {
    return this.jwtService.verifyAsync<CustomTokenPayload<T>>(token);
  }

  decodeToken(token: string): null | CustomTokenPayload<T> {
    return this.jwtService.decode<CustomTokenPayload<T> | null>(token);
  }
}
