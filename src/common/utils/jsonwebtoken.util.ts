import { Injectable, Logger } from '@nestjs/common';
import {
  Algorithm,
  sign,
  SignOptions,
  verify,
  VerifyOptions,
} from 'jsonwebtoken';

import ENV from '../../config/env.config';
import { CustomTokenPayload } from '../types/jwt.type';

@Injectable()
export class JsonWebToken {
  private readonly secret: string;
  private readonly expiryTime: string | number;
  private readonly algorithms: Algorithm[];

  private readonly logger = new Logger(JsonWebToken.name);

  constructor() {
    this.secret = ENV.JWT_SECRET;
    this.expiryTime = ENV.JWT_EXPIRY_TIME;
    this.algorithms = ['HS512']; // Default algorithm
  }

  /**
   * Generates a JWT token for a given payload
   * @param {CustomTokenPayload} payload - The payload to include in the token
   * @param {SignOptions} [options] - Optional signing options
   * @returns {string} - The generated JWT token
   */
  public generateJwtToken<T>(
    payload: CustomTokenPayload<T>,
    options?: SignOptions,
  ): string {
    const signOptions: SignOptions = {
      expiresIn: this.expiryTime as any, // Cast to number if necessary
      algorithm: this.algorithms[0], // Default algorithm
      ...options,
    };

    try {
      const token = sign(payload, this.secret, signOptions);
      return token;
    } catch (error) {
      this.logger.error('Error while generating token', {
        error: (error as Error).message,
      });
      throw new Error('Error generating token');
    }
  }

  /**
   * Verifies a JWT token and returns the decoded payload
   * @param {string} token - The JWT token to verify
   * @param {VerifyOptions} [options] - Optional verification options
   * @returns {CustomTokenPayload} - The decoded payload
   */
  public verifyJwtToken<T>(
    token: string,
    options?: VerifyOptions,
  ): CustomTokenPayload<T> {
    const verifyOptions: VerifyOptions = {
      algorithms: this.algorithms,
      ...options,
    };

    try {
      return verify(token, this.secret, verifyOptions) as CustomTokenPayload<T>;
    } catch (error) {
      this.logger.error('Invalid token', { error: error.message });
      throw new Error('Invalid Token');
    }
  }
}
