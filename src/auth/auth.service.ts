import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

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
    return this._userService.createUser(body, logger);
  }

  public async login(
    body: LoginUserRequestType,
    logger: LoggerService,
  ): Promise<LoginResponseType> {
    const { email, password } = body;

    logger.logInfo({
      action: 'info',
      message: `Attempting login for user: ${email}`,
      source: 'AuthService#login',
    });

    const user = await this._userService.findUserBy(
      {
        where: {
          email,
          isDeleted: false,
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
      logger.logError({
        message: `User not found with email: ${email}`,
        action: 'error',
        source: 'AuthService#login',
      });
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await BcryptUtil.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      logger.logError({
        message: 'Invalid password',
        action: 'error',
        source: 'AuthService#login',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const userPayload: UserAuthTokenPayload = {
      sub: user.id,
      role: user.role,
    };

    const token = this._jwtService.generateJwtToken(userPayload);

    void this._userService.updateUserBy(
      { id: user.id },
      { lastLogin: new Date() },
      logger,
    );

    logger.logInfo({
      action: 'info',
      message: `User logged in successfully: ${email}`,
      source: 'AuthService#login',
    });

    return { accessToken: token };
  }

  public async getUserProfile(
    userId: string,
    logger: LoggerService,
  ): Promise<Partial<UserEntity>> {
    const user = await this._userService.findUserBy(
      {
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          lastLogin: true,
        },
      },
      logger,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
