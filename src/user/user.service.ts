import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOneOptions,
  FindOptionsWhere,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { UserAuthTokenPayload } from '../auth/interfaces/jwtPayload.interface';
import UserRoleEnum from '../common/enums/role.enum';
import { SimpleResponseType } from '../common/types/response/genericMessage.type';
import LoggerService from '../common/utils/logging/loggerService';
import { DocumentService } from '../document/document.service';

import GetAllUsersDto from './dtos/getAllUsers.dto';
import GetUserDocumentsDTO from './dtos/getUserDocuements.dto';
import UserEntity from './entities/user.entity';
import { UpdateUserDetailsRequestBodyType } from './schemas/request/user.schema';
import { GetUserDocumentsResponseType } from './types/response/getUserDocuments.type';

@Injectable()
export default class UserService {
  public constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepo: Repository<UserEntity>,

    private readonly _documentService: DocumentService,
  ) {}

  public async createUser(
    user: Partial<UserEntity>,
    logger: LoggerService,
  ): Promise<UserEntity> {
    logger.logInfo({
      action: 'info',
      message: `Creating user with: ${JSON.stringify(user)}`,
      source: 'UserService#createUser',
    });

    const userEntity = this._userRepo.create(user);
    const savedUser = await this._userRepo.save(userEntity);

    return savedUser;
  }

  public async findUserBy(
    options: FindOneOptions<UserEntity>,
    logger: LoggerService,
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

      throw error;
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
    queryParams: GetAllUsersDto,
    logger: LoggerService,
  ): Promise<{
    data: UserEntity[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const {
        select,
        fullName,
        email,
        role,
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

      if (typeof isDeleted === 'boolean') {
        if (isDeleted) {
          query.andWhere('user.deleted_at IS NOT NULL');
        } else {
          query.andWhere('user.deleted_at IS NULL');
        }
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

      return { data, totalCount: total, totalPages: Math.ceil(total / limit) };
    } catch (error) {
      logger.logError({
        action: 'error',
        source: 'UserService#getAllUsers',
        message: `Error while getting all users with filter: ${JSON.stringify(queryParams)}`,
        errorMessage: (error as Error).message,
      });
      throw error;
    }
  }

  public async getUserById(
    id: string,
    logger: LoggerService,
  ): Promise<UserEntity> {
    try {
      const user = await this._userRepo.findOne({
        where: { id, role: Not(UserRoleEnum.ADMIN) },
        select: {
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          fullName: true,
          email: true,
          role: true,
          version: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found by provided ID');
      }

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

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Something went wrong while fetching user',
      );
    }
  }

  public async updateUserDetails(
    id: string,
    body: UpdateUserDetailsRequestBodyType,
    logger: LoggerService,
  ): Promise<SimpleResponseType> {
    try {
      if ('role' in body && body.role === UserRoleEnum.ADMIN) {
        throw new Error('Cannot assign admin role');
      }

      const updateResult = await this._userRepo.update(
        { id, role: Not(UserRoleEnum.ADMIN) },
        body,
      );

      if (updateResult.affected === 0) {
        throw new NotFoundException(
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

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Something went wrong while updating user',
      );
    }
  }

  public async deleteUserById(
    id: string,
    logger: LoggerService,
  ): Promise<SimpleResponseType> {
    try {
      const result = await this._userRepo.softDelete({ id });

      if (result.affected === 0) {
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
    user: UserAuthTokenPayload,
    query: GetUserDocumentsDTO,
    logger: LoggerService,
  ): Promise<GetUserDocumentsResponseType> {
    if (user.role === UserRoleEnum.ADMIN) {
      // Admin can check own or others' documents
      query.id = query?.id || user.sub;
      query.needToIncludeFilePath = true;
    } else {
      // Non-admins can only access their own documents
      query.id = user.sub;
    }

    return this._documentService.getUserDocuments(query, logger);
  }
}
