import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { IsNull, QueryFailedError } from 'typeorm';

import BcryptUtil from '../common/utils/bcrypt.util';
import { JsonWebToken } from '../common/utils/jsonwebtoken.util';
import LoggerService from '../common/utils/logging/loggerService';
import UserEntity from '../user/entities/user.entity';
import { CreateUserResponseType } from '../user/types/response/createUser.type';
import UserService from '../user/user.service';

import { UserAuthTokenPayload } from './interfaces/jwtPayload.interface';
import {
  CreateUserRequestType,
  LoginUserRequestType,
} from './schemas/request/auth.schema';
import { LoginResponseType } from './types/response/login.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly _userService: UserService,
    private readonly _jwtService: JsonWebToken,
  ) {}

  public async createUser(
    body: CreateUserRequestType,
    logger: LoggerService,
  ): Promise<CreateUserResponseType> {
    try {
      logger.logInfo({
        action: 'info',
        source: 'AuthService#createUser',
        message: `User created into db with email: ${body.email}`,
      });

      const { id, role } = await this._userService.createUser(body, logger);
      return {
        id,
        role,
      };
    } catch (error) {
      logger.logError({
        message: `error while creating the user with email: ${body.email}`,
        action: 'error',
        source: 'AuthService#createUser',
        errorMessage: (error as Error).message,
      });
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  public async login(
    body: LoginUserRequestType,
    logger: LoggerService,
  ): Promise<LoginResponseType> {
    const { email, password } = body;

    try {
      const user = await this._userService.findUserBy(
        {
          where: {
            email,
            deletedAt: IsNull(),
          },
          select: {
            id: true,
            password: true,
            role: true,
          },
        },
        logger,
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = BcryptUtil.comparePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const userPayload: UserAuthTokenPayload = {
        sub: user.id,
        role: user.role,
      };

      const accessToken = this._jwtService.generateJwtToken(userPayload);

      logger.logInfo({
        action: 'info',
        message: `User logged in successfully: ${email}`,
        source: 'AuthService#login',
      });

      return { accessToken };
    } catch (error) {
      logger.logError({
        action: 'error',
        errorMessage: (error as Error).message,
        message: `Error while login with email: ${email}`,
        source: 'AuthService#login',
      });
      throw error;
    }
  }

  public async getUserProfile(
    userId: string,
    logger: LoggerService,
  ): Promise<Partial<UserEntity>> {
    try {
      const user = await this._userService.findUserBy(
        {
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        logger,
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }
      logger.logInfo({
        action: 'info',
        message: `User found for ID ${userId}`,
        source: 'AuthService#getUserProfile',
      });
      return user;
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Error while getting user profile for ID: ${userId}`,
        errorMessage: (error as Error).message,
        source: 'AuthService#getUserProfile',
      });
      throw error;
    }
  }
}
