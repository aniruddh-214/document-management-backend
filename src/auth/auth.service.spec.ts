import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import UserService from '../user/user.service';
import { JsonWebToken } from '../common/utils/jsonwebtoken.util';
import { AuthService } from './auth.service';
import { CreateUserRequestType } from './schemas/request/auth.schema';
import LoggerService from '../common/utils/logging/loggerService';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JsonWebToken, jest.Mock>>;
  let logger: Partial<Record<keyof LoggerService, jest.Mock>>;

  beforeEach(() => {
    userService = {
      createUser: jest.fn(),
      findUserBy: jest.fn(),
    };

    jwtService = {
      generateJwtToken: jest.fn(),
    };

    logger = {
      logInfo: jest.fn(),
      logError: jest.fn(),
    };

    authService = new AuthService(userService as any, jwtService as any);
  });

  describe('createUser', () => {
    const userDto = {
      fullName: 'Test',
      email: 'test@example.com',
      password: 'password',
    };

    it('should create a user and return id and role', async () => {
      userService.createUser!.mockResolvedValue({ id: '123', role: 'user' });

      const result = await authService.createUser(
        userDto,
        logger as unknown as LoggerService,
      );

      expect(userService.createUser).toHaveBeenCalledWith(userDto, logger);
      expect(logger.logInfo).toHaveBeenCalled();
      expect(result).toEqual({ id: '123', role: 'user' });
    });

    it('should throw ConflictException on duplicate email error', async () => {
      const error = new QueryFailedError('query', [], <Error>{});
      (<any>error).driverError = { code: '23505' };
      userService.createUser!.mockRejectedValue(error);

      await expect(
        authService.createUser(userDto, logger as unknown as LoggerService),
      ).rejects.toThrow(ConflictException);
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      const error = new Error('some other error');
      userService.createUser!.mockRejectedValue(error);

      await expect(
        authService.createUser(userDto, logger as unknown as LoggerService),
      ).rejects.toThrow(InternalServerErrorException);
      expect(logger.logError).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password' };
    const userFromDb = { id: '123', password: 'hashedpassword', role: 'user' };

    beforeEach(() => {
      jest
        .spyOn(
          require('../common/utils/bcrypt.util').default,
          'comparePassword',
        )
        .mockImplementation(() => true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return access token if login successful', async () => {
      userService.findUserBy!.mockResolvedValue(userFromDb);
      jwtService.generateJwtToken!.mockReturnValue('token123');

      const result = await authService.login(
        loginDto,
        logger as unknown as LoggerService,
      );

      expect(userService.findUserBy).toHaveBeenCalled();
      expect(jwtService.generateJwtToken).toHaveBeenCalledWith({
        sub: '123',
        role: 'user',
      });
      expect(logger.logInfo).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'token123' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findUserBy!.mockResolvedValue(null);

      await expect(
        authService.login(loginDto, logger as unknown as LoggerService),
      ).rejects.toThrow(NotFoundException);
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      userService.findUserBy!.mockResolvedValue(userFromDb);
      jest
        .spyOn(
          require('../common/utils/bcrypt.util').default,
          'comparePassword',
        )
        .mockImplementation(() => false);

      await expect(
        authService.login(loginDto, logger as unknown as LoggerService),
      ).rejects.toThrow(UnauthorizedException);
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should log error and rethrow on unexpected error', async () => {
      const error = new Error('unexpected');
      userService.findUserBy!.mockRejectedValue(error);

      await expect(
        authService.login(loginDto, logger as unknown as LoggerService),
      ).rejects.toThrow(error);
      expect(logger.logError).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    const userId = '123';
    const userProfile = { id: userId, email: 'test@example.com', role: 'user' };

    it('should return user profile if found', async () => {
      userService.findUserBy!.mockResolvedValue(userProfile);

      const result = await authService.getUserProfile(
        userId,
        logger as unknown as LoggerService,
      );

      expect(userService.findUserBy).toHaveBeenCalledWith(
        {
          where: { id: userId },
          select: { id: true, email: true, role: true },
        },
        logger,
      );
      expect(logger.logInfo).toHaveBeenCalled();
      expect(result).toEqual(userProfile);
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findUserBy!.mockResolvedValue(null);

      await expect(
        authService.getUserProfile(userId, logger as unknown as LoggerService),
      ).rejects.toThrow(NotFoundException);
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should log error and rethrow on unexpected error', async () => {
      const error = new Error('unexpected');
      userService.findUserBy!.mockRejectedValue(error);

      await expect(
        authService.getUserProfile(userId, logger as unknown as LoggerService),
      ).rejects.toThrow(error);
      expect(logger.logError).toHaveBeenCalled();
    });
  });
});
