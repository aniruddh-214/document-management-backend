import { Logger } from '@nestjs/common';
import { JsonWebToken } from './jsonwebtoken.util';
import ENV from '../../config/env.config';
import { sign, verify } from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('JsonWebToken Service', () => {
  let jwtService: JsonWebToken;

  beforeEach(() => {
    // Spy on Logger methods to silence output
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    jwtService = new JsonWebToken();
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore Logger after tests
    jest.restoreAllMocks();
  });

  describe('generateJwtToken', () => {
    it('should generate a token successfully', () => {
      const payload = { userId: 1 };
      const fakeToken = 'signed.jwt.token';

      (sign as jest.Mock).mockReturnValue(fakeToken);

      const token = jwtService.generateJwtToken(payload);

      expect(sign).toHaveBeenCalledWith(
        payload,
        ENV.JWT_SECRET,
        expect.objectContaining({
          expiresIn: ENV.JWT_EXPIRY_TIME,
          algorithm: 'HS512',
        }),
      );
      expect(token).toBe(fakeToken);
    });

    it('should throw an error if sign fails', () => {
      const payload = { userId: 1 };

      (sign as jest.Mock).mockImplementation(() => {
        throw new Error('sign error');
      });

      expect(() => jwtService.generateJwtToken(payload)).toThrow(
        'Error generating token',
      );
      // Logger.error won't output anything because we mocked it
    });
  });

  describe('verifyJwtToken', () => {
    it('should verify and return decoded payload successfully', () => {
      const token = 'some.jwt.token';
      const decodedPayload = { userId: 1 };

      (verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = jwtService.verifyJwtToken(token);

      expect(verify).toHaveBeenCalledWith(
        token,
        ENV.JWT_SECRET,
        expect.objectContaining({
          algorithms: ['HS512'],
        }),
      );
      expect(result).toEqual(decodedPayload);
    });

    it('should throw an error if verification fails', () => {
      const token = 'invalid.jwt.token';

      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token error');
      });

      expect(() => jwtService.verifyJwtToken(token)).toThrow('Invalid Token');
      // Logger.error won't output anything because we mocked it
    });
  });
});
