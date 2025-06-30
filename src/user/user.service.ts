import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  Not,
  QueryFailedError,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { CreateUserRequestType } from '../auth/schemas/request/auth.schema';
import UserRoleEnum from '../common/enums/role.enum';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import BcryptUtil from '../common/utils/bcrypt.util';
import LoggerService from '../common/utils/logging/loggerService';
import { DocumentService } from '../document/document.service';
import { DocumentEntity } from '../document/entities/document.entity';

import GetAllUsersDto from './dtos/getAllUsers.dto';
import UserEntity from './entities/user.entity';
import {
  UpdateUserDetailsRequestBodyType,
  UpdateUserDetailsRequestParamsType,
} from './schemas/request/user.schema';
import { CreateUserResponseType } from './types/response/createUser.type';

@Injectable()
export default class UserService {
  public constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepo: Repository<UserEntity>,

    private readonly _documentService: DocumentService,
  ) {}

  public async createUser(
    body: CreateUserRequestType,
    logger: LoggerService,
  ): Promise<CreateUserResponseType> {
    const hashedPassword = await BcryptUtil.hashPassword(body.password);

    const user = {
      ...body,
      role: UserRoleEnum.VIEWER,
      password: hashedPassword,
    };

    logger.logInfo({
      action: 'info',
      message: `Saving user into database with email: ${user.email}`,
      source: 'UserService#createUser',
    });

    try {
      const result: InsertResult = await this._userRepo
        .createQueryBuilder()
        .insert()
        .into(UserEntity)
        .values(user)
        .returning(['id', 'role'])
        .execute();

      const insertedUser = result.raw[0];

      return {
        id: insertedUser.id,
        role: insertedUser.role,
      };
    } catch (error) {
      logger.logError({
        message: 'error while creating the user',
        action: 'error',
        source: 'UserService#createUser',
        errorMessage: error?.message,
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

  public async findUserBy(
    logger: LoggerService,
    options: FindOneOptions<UserEntity>,
  ): Promise<UserEntity> {
    logger.logInfo({
      action: 'info',
      message: `Finding user by condition: ${JSON.stringify(options?.where)}`,
      source: 'UserService#findUserBy',
    });

    try {
      const user = await this._userRepo.findOne(options);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      logger.logError({
        message: 'Error while finding the user',
        action: 'error',
        source: 'UserService#findUserBy',
        errorMessage: error?.message,
      });

      throw new InternalServerErrorException('Failed to find user');
    }
  }

  public async updateUserBy(
    condition: FindOptionsWhere<UserEntity>,
    updates: QueryDeepPartialEntity<UserEntity>,
    logger: LoggerService,
  ): Promise<UpdateResult> {
    logger.logInfo({
      action: 'info',
      message: `Updating user ${JSON.stringify(condition)}`,
      source: 'UserService#updateUser',
    });

    try {
      return await this._userRepo.update(condition, updates);
    } catch (error) {
      logger.logError({
        message: 'Error while updating the user',
        action: 'error',
        source: 'UserService#updateUser',
        errorMessage: error?.message,
      });

      throw new InternalServerErrorException('Failed to update user');
    }
  }

  public async getAllUsers(
    logger: LoggerService,
    queryParams: GetAllUsersDto,
  ): Promise<{ data: UserEntity[]; total: number }> {
    const {
      select,
      fullName,
      email,
      role,
      isActive,
      isDeleted,
      page,
      limit,
      sortOrder,
    } = queryParams;

    const query = this._userRepo.createQueryBuilder('user');
    query.withDeleted();
    const columns = select?.map((field) => `user.${field}`);
    query.select(columns);

    if (fullName) {
      query.andWhere('user.full_name ILIKE :name', { name: `%${fullName}%` });
    }

    if (email) {
      query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }

    if (role?.length) {
      query.andWhere('user.role IN (:...roles)', { roles: role });
    }

    if (typeof isActive !== 'undefined') {
      query.andWhere('user.is_active = :isActive', { isActive });
    }

    if (typeof isDeleted !== 'undefined') {
      query.andWhere('user.is_deleted = :isDeleted', { isDeleted });
    }

    query.andWhere('user.role != :excludedRole', { excludedRole: 'admin' });

    query
      .orderBy(`user.created_at`, sortOrder)
      .skip((+page - 1) * +limit)
      .take(+limit);

    const [data, total] = await query.getManyAndCount();

    logger.logInfo({
      action: 'info',
      message: `Fetched ${data.length} users (Page ${page})`,
      source: 'UserService#getAllUsers',
    });

    return { data, total };
  }

  public async getUserById(
    logger: LoggerService,
    id: string,
  ): Promise<UserEntity | null> {
    try {
      const user = await this._userRepo.findOne({
        where: { id, role: Not(UserRoleEnum.ADMIN) },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          isDeleted: true,
          deletedAt: true,
          fullName: true,
          email: true,
          role: true,
          lastLogin: true,
        },
      });

      logger.logInfo({
        action: 'info',
        message: user ? `Fetched user with id: ${id}` : `User not found: ${id}`,
        source: 'UserService#getUserById',
      });

      return user;
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Failed to fetch user by id: ${id}`,
        source: 'UserService#getUserById',
        error,
      });

      // Re-throw known Nest exceptions, wrap others
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong while fetching user',
      );
    }
  }

  public async updateUserDetails(
    logger: LoggerService,
    params: UpdateUserDetailsRequestParamsType,
    body: UpdateUserDetailsRequestBodyType,
  ): Promise<SimpleResponseType> {
    const { id } = params;

    try {
      if ('role' in body && body.role === UserRoleEnum.ADMIN) {
        throw new Error('Cannot assign admin role');
      }

      const updateResult = await this._userRepo.update(
        { id, role: Not(UserRoleEnum.ADMIN) },
        body,
      );

      if (updateResult.affected === 0) {
        logger.logInfo({
          action: 'info',
          message: `No user updated, either not found or admin user: ${id}`,
          source: 'UserService#updateUserDetails',
        });
        throw new Error(
          `User with id ${id} not found or cannot update admin user`,
        );
      }

      logger.logInfo({
        action: 'info',
        message: `Updated user with id: ${id}`,
        source: 'UserService#updateUserDetails',
      });

      return { message: `New user role: ${body.role}` };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Failed to update user by id: ${id}`,
        source: 'UserService#updateUserDetails',
        error,
      });

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Something went wrong while updating user',
      );
    }
  }

  public async deleteUserById(
    logger: LoggerService,
    id: string,
  ): Promise<SimpleResponseType> {
    try {
      const result = await this._userRepo.update(
        {
          id,
          role: Not(UserRoleEnum.ADMIN),
          isDeleted: false,
        },
        {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      );

      if (result.affected === 0) {
        logger.logInfo({
          action: 'info',
          message: `User not deleted (not found, already deleted, or is admin): ${id}`,
          source: 'UserService#deleteUserById',
        });

        throw new NotFoundException(
          `User with ID ${id} not found, already deleted, or is an admin`,
        );
      }

      logger.logInfo({
        action: 'info',
        message: `User soft-deleted: ${id}`,
        source: 'UserService#deleteUserById',
      });

      return { message: `User with id ${id} has been deleted successfully` };
    } catch (error) {
      logger.logError({
        action: 'error',
        message: `Failed to delete user by id: ${id}`,
        source: 'UserService#deleteUserById',
        error,
      });

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong while deleting the user',
      );
    }
  }

  public async getUserDocuments(
    logger: LoggerService,
    userId: string,
  ): Promise<DocumentEntity[]> {
    return this._documentService.getUserDocuments(logger, userId);
  }
}
