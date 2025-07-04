import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';

import UserService from './user.service';
import UserEntity from './entities/user.entity';
import LoggerService from '../common/utils/logging/loggerService';
import AppDataSource from '../config/typeorm.config';
import { DocumentService } from '../document/document.service';
import TestFixtureHelper from '../scripts/test/testDatabseSeederHelper';
import { MOCK_LOGGER_SERVICE, TEST_USER } from '../scripts/test/dummyData';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import UserRoleEnum from '../common/enums/role.enum';
import GetAllUsersDto from './dtos/getAllUsers.dto';
import { DatabaseSortingOrder } from '../common/enums/dbOrderSort.enum';
import { GetAllUSersRequestQueryType } from './schemas/request/user.schema';
import { UserAuthTokenPayload } from '../auth/interfaces/jwtPayload.interface';
import GetUserDocumentsDTO from './dtos/getUserDocuements.dto';

describe('UserService', () => {
  let userService: UserService;
  let documentService: DocumentService;
  let userRepository: Repository<UserEntity>;

  const mockDocumentService = {
    getUserDocuments: jest.fn(),
  };

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: AppDataSource.getRepository(UserEntity),
        },
        {
          provide: DocumentService, // provide by class, NOT string token
          useValue: mockDocumentService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    documentService = module.get<DocumentService>(DocumentService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  beforeEach(async () => {
    await TestFixtureHelper.clearUserTable();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  //  -->>

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const newUser = await userService.createUser(
        TEST_USER,
        MOCK_LOGGER_SERVICE,
      );

      // Assertions
      expect(newUser).toBeDefined();
      expect(newUser.id).toBeDefined();
      expect(newUser.fullName).toBe(TEST_USER.fullName);
      expect(newUser.email).toBe(TEST_USER.email);

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: `Creating user with: "${TEST_USER.email}"`,
          source: 'UserService#createUser',
        }),
      );
      await userRepository.delete({ id: newUser.id });
    });
  });

  describe('findUserById', () => {
    it('should find the user from database', async () => {
      const user = await TestFixtureHelper.insertUser();

      const result = await userService.findUserBy(
        { where: { id: user.id } },
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
      expect(result.email).toBe(user.email);
      expect(result.fullName).toBe(user.fullName);

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(user.id),
          source: 'UserService#findUserBy',
        }),
      );

      expect(MOCK_LOGGER_SERVICE.logError).not.toHaveBeenCalled();
      await TestFixtureHelper.deleteUser({ id: result.id });
    });

    it('should throw NotFoundException when user is not found', async () => {
      await expect(
        userService.findUserBy(
          { where: { id: randomUUID() } },
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow('User not found');

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error while finding the user',
          action: 'error',
          source: 'UserService#findUserBy',
          errorMessage: expect.any(String),
        }),
      );
    });
  });
  describe('updateUserBy', () => {
    it('should update the user and return UpdateResult', async () => {
      const user = await TestFixtureHelper.insertUser();

      const updates = { fullName: 'Updated Name' };

      const result: UpdateResult = await userService.updateUserBy(
        { id: user.id },
        updates,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.affected).toBe(1);

      const updatedUser = await userRepository.findOneBy({ id: user.id });
      expect(updatedUser?.fullName).toBe('Updated Name');

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(user.id),
          source: 'UserService#updateUser',
        }),
      );
      await TestFixtureHelper.deleteUser({ id: user.id });
    });

    it('should throw InternalServerErrorException and log error on failure', async () => {
      const invalidCondition = { id: 'invalid-id' };
      const updates = { fullName: 'New Name' };

      const mockError = new Error('DB error');
      jest.spyOn(userRepository, 'update').mockRejectedValueOnce(mockError);

      await expect(
        userService.updateUserBy(
          invalidCondition,
          updates,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(InternalServerErrorException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error while updating the user',
          action: 'error',
          source: 'UserService#updateUser',
          errorMessage: mockError.message,
        }),
      );
    });
  });

  describe('getAllUsers', () => {
    const baseQueryParams: GetAllUsersDto = {
      select: ['id', 'fullName', 'email'],
      fullName: 'John',
      email: 'john@example.com',
      role: [UserRoleEnum.VIEWER],
      isDeleted: false,
      page: 1,
      limit: 10,
      sortOrder: DatabaseSortingOrder.ASC,
    };

    it('should fetch users with filters and pagination', async () => {
      await TestFixtureHelper.insertUser({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Password@123',
        role: UserRoleEnum.VIEWER,
      });
      await TestFixtureHelper.insertUser({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password@123',
        role: UserRoleEnum.VIEWER,
      });

      const result = await userService.getAllUsers(
        baseQueryParams,
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.totalPages).toBeGreaterThanOrEqual(1);

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(
            `Fetched ${result.data.length} users`,
          ),
          source: 'UserService#getAllUsers',
        }),
      );
    });

    it('should fetch only soft-deleted users when isDeleted is true', async () => {
      jest.resetAllMocks();
      const deletedUser = await TestFixtureHelper.insertUser({
        fullName: 'Deleted User',
        email: 'deleted@example.com',
        password: 'TestUser@123',
      });
      await TestFixtureHelper.softDeleteUser({ id: deletedUser.id });

      const activeUser = await TestFixtureHelper.insertUser({
        fullName: 'Active User',
        email: 'active@example.com',
        password: 'TestUser@123',
      });

      const result = await userService.getAllUsers(
        new GetAllUsersDto({
          select: baseQueryParams.select,
          isDeleted: true,
          page: 1,
          limit: 30,
          sortOrder: DatabaseSortingOrder.ASC,
        } as GetAllUSersRequestQueryType),
        MOCK_LOGGER_SERVICE,
      );

      // Should include deleted user
      expect(result.data.some((user) => user.id === deletedUser.id)).toBe(true);

      // Should NOT include active user
      expect(result.data.some((user) => user.id === activeUser.id)).toBe(false);

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(
            `Fetched ${result.data.length} users`,
          ),
          source: 'UserService#getAllUsers',
        }),
      );
      await TestFixtureHelper.clearUserTable();
    });

    it('should fetch only soft-deleted users when isDeleted is something else', async () => {
      const deletedUser = await TestFixtureHelper.insertUser({
        fullName: 'Deleted User',
        email: 'deleted@example.com',
        password: 'TestUser@123',
      });
      await TestFixtureHelper.softDeleteUser({ id: deletedUser.id });

      const activeUser = await TestFixtureHelper.insertUser({
        fullName: 'Active User',
        email: 'active@example.com',
        password: 'TestUser@123',
      });

      const result = await userService.getAllUsers(
        new GetAllUsersDto({
          select: baseQueryParams.select,
          isDeleted: '' as unknown as boolean,
          page: 1,
          limit: 30,
          sortOrder: DatabaseSortingOrder.ASC,
        } as GetAllUSersRequestQueryType),
        MOCK_LOGGER_SERVICE,
      );

      expect(result.data.some((user) => user.id === deletedUser.id)).toBe(true);

      expect(result.data.some((user) => user.id === activeUser.id)).toBe(true);

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(
            `Fetched ${result.data.length} users`,
          ),
          source: 'UserService#getAllUsers',
        }),
      );
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw and log error when query fails', async () => {
      // Spy on createQueryBuilder and force it to throw
      const spy = jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockImplementation(() => {
          throw new Error('DB failure');
        });

      await expect(
        userService.getAllUsers(baseQueryParams, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow('DB failure');

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          source: 'UserService#getAllUsers',
          message: expect.stringContaining('Error while getting all users'),
          errorMessage: 'DB failure',
        }),
      );

      spy.mockRestore(); // ✅ restores original method
    });
  });

  describe('getUserById', () => {
    it('should return user when a valid non-admin ID is provided', async () => {
      const testUser = await TestFixtureHelper.insertUser();

      const result = await userService.getUserById(
        testUser.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(testUser.email);
      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: expect.stringContaining(
            `Fetched user with id: ${testUser.id}`,
          ),
          source: 'UserService#getUserById',
        }),
      );

      await TestFixtureHelper.deleteUser({ id: testUser.id });
    });

    it('should throw NotFoundException for non-existing user', async () => {
      const fakeId = randomUUID();

      await expect(
        userService.getUserById(fakeId, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(NotFoundException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          message: expect.stringContaining(
            `Failed to fetch user by id: ${fakeId}`,
          ),
          source: 'UserService#getUserById',
        }),
      );
    });

    it('should not return admin user even if ID is valid', async () => {
      const adminUser = await TestFixtureHelper.insertUser({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin$$321',
        role: UserRoleEnum.ADMIN,
      });

      await expect(
        userService.getUserById(adminUser.id, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(NotFoundException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          message: expect.stringContaining(
            `Failed to fetch user by id: ${adminUser.id}`,
          ),
          source: 'UserService#getUserById',
        }),
      );

      await TestFixtureHelper.deleteUser({ id: adminUser.id });
    });

    it('should throw InternalServerErrorException when DB throws an unknown error', async () => {
      const testUserId = randomUUID();

      // Spy and force the repository to throw a generic error
      jest
        .spyOn(userService['_userRepo'], 'findOne')
        .mockRejectedValueOnce(new Error('Unexpected DB error'));

      await expect(
        userService.getUserById(testUserId, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Something went wrong while fetching user',
        ),
      );

      // logError should be called
      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          source: 'UserService#getUserById',
          message: `Failed to fetch user by id: ${testUserId}`,
        }),
      );
    });
  });

  describe('updateUserDetails', () => {
    const testUserId = randomUUID();

    it('should successfully update user details and return message', async () => {
      const insertedUser = await TestFixtureHelper.insertUser();

      const result = await userService.updateUserDetails(
        insertedUser.id,
        {
          role: UserRoleEnum.EDITOR,
        },
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toEqual({
        message: `New user role: ${UserRoleEnum.EDITOR}`,
      });

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'info',
          message: `Updated user with id: ${insertedUser.id}`,
          source: 'UserService#updateUserDetails',
        }),
      );
      await TestFixtureHelper.deleteUser({ id: insertedUser.id });
    });

    it('should throw error if trying to assign admin role', async () => {
      const insertedUser = await TestFixtureHelper.insertUser();
      const payload = { role: UserRoleEnum.ADMIN };

      await expect(
        userService.updateUserDetails(
          insertedUser.id,
          payload,
          MOCK_LOGGER_SERVICE,
        ),
      ).rejects.toThrow(new BadRequestException('Cannot assign admin role'));

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalled();
      await TestFixtureHelper.deleteUser({ id: insertedUser.id });
    });

    it('should throw NotFoundException if user is not found or is admin', async () => {
      const payload = { role: UserRoleEnum.EDITOR };

      await expect(
        userService.updateUserDetails(testUserId, payload, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(
        new NotFoundException(
          `User with id ${testUserId} not found or cannot update admin user`,
        ),
      );

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'UserService#updateUserDetails',
          message: `Failed to update user by id: ${testUserId}`,
        }),
      );
    });

    it('should handle DB error when updating user details', async () => {
      const payload = { role: UserRoleEnum.VIEWER };

      const mockExecute = jest.fn().mockRejectedValue(new Error('db error'));

      const mockQueryBuilder: any = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: mockExecute,
      };

      const spy = jest
        .spyOn(userService['_userRepo'], 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder);

      await expect(
        userService.updateUserDetails(testUserId, payload, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(InternalServerErrorException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          source: 'UserService#updateUserDetails',
          message: expect.stringContaining('Failed to update user'),
          error: expect.any(Error),
        }),
      );
      spy.mockRestore();
    });
  });

  describe('deleteUserById', () => {
    it('Should soft delete user', async () => {
      const insertedUser = await TestFixtureHelper.insertUser();

      const result = await userService.deleteUserById(
        insertedUser.id,
        MOCK_LOGGER_SERVICE,
      );

      expect(result).toEqual({
        message: `User with id ${insertedUser.id} has been deleted successfully`,
      });

      expect(MOCK_LOGGER_SERVICE.logInfo).toHaveBeenCalledWith({
        action: 'info',
        message: `User soft-deleted: ${insertedUser.id}`,
        source: 'UserService#deleteUserById',
      });

      expect(MOCK_LOGGER_SERVICE.logError).not.toHaveBeenCalled();

      // Verify user is soft deleted (deletedAt is set)
      const deletedUser = await userRepository.findOne({
        where: { id: insertedUser.id },
        withDeleted: true,
      });
      expect(deletedUser?.deletedAt).toBeTruthy();
      await TestFixtureHelper.clearUserTable();
    });

    it('should throw NotFoundException if user already deleted or does not exist', async () => {
      // Attempt deleting the same user again
      await expect(
        userService.deleteUserById(randomUUID(), MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(NotFoundException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          source: 'UserService#deleteUserById',
          message: expect.stringContaining('Failed to delete user by id'),
          error: expect.any(NotFoundException),
        }),
      );

      expect(MOCK_LOGGER_SERVICE.logInfo).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on unknown error during softDelete', async () => {
      const testUserId = randomUUID();

      // Spy on the softDelete method to throw an unexpected error
      const spy = jest
        .spyOn(userService['_userRepo'], 'softDelete')
        .mockRejectedValue(new Error('DB failure'));

      await expect(
        userService.deleteUserById(testUserId, MOCK_LOGGER_SERVICE),
      ).rejects.toThrow(InternalServerErrorException);

      expect(MOCK_LOGGER_SERVICE.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          source: 'UserService#deleteUserById',
          message: `Failed to delete user by id: ${testUserId}`,
          error: expect.any(Error),
        }),
      );
      spy.mockRestore();
    });
  });

  describe('getUserDocuments', () => {
    it('should set query.id to user.sub and needToIncludeFilePath=true for ADMIN role', async () => {
      const adminUser = {
        role: UserRoleEnum.ADMIN,
        sub: 'admin-user-id',
      } as UserAuthTokenPayload;

      const query = {
        id: undefined,
        needToIncludeFilePath: false,
      } as GetUserDocumentsDTO;

      mockDocumentService.getUserDocuments.mockResolvedValue('admin-docs');

      const result = await userService.getUserDocuments(
        adminUser,
        query,
        MOCK_LOGGER_SERVICE,
      );

      expect(query.id).toBe(adminUser.sub);
      expect(query.needToIncludeFilePath).toBe(true);
      expect(mockDocumentService.getUserDocuments).toHaveBeenCalledWith(
        query,
        MOCK_LOGGER_SERVICE,
      );
      expect(result).toBe('admin-docs');
    });

    it('should keep query.id if provided for ADMIN role and set needToIncludeFilePath=true', async () => {
      const adminUser = {
        role: UserRoleEnum.ADMIN,
        sub: 'admin-user-id',
      } as UserAuthTokenPayload;

      const query = {
        id: 'other-user-id',
        needToIncludeFilePath: false,
      } as GetUserDocumentsDTO;

      mockDocumentService.getUserDocuments.mockResolvedValue('other-docs');

      const result = await userService.getUserDocuments(
        adminUser,
        query,
        MOCK_LOGGER_SERVICE,
      );

      expect(query.id).toBe('other-user-id'); // unchanged
      expect(query.needToIncludeFilePath).toBe(true);
      expect(mockDocumentService.getUserDocuments).toHaveBeenCalledWith(
        query,
        MOCK_LOGGER_SERVICE,
      );
      expect(result).toBe('other-docs');
    });

    it('should override query.id to user.sub and NOT change needToIncludeFilePath for non-admin user', async () => {
      const normalUser = {
        role: UserRoleEnum.EDITOR,
        sub: 'normal-user-id',
      } as UserAuthTokenPayload;

      const query = {
        id: 'some-other-id',
        needToIncludeFilePath: false,
      } as GetUserDocumentsDTO;

      mockDocumentService.getUserDocuments.mockResolvedValue('user-docs');

      const result = await userService.getUserDocuments(
        normalUser,
        query,
        MOCK_LOGGER_SERVICE,
      );

      expect(query.id).toBe(normalUser.sub);
      expect(query.needToIncludeFilePath).toBe(false);
      expect(mockDocumentService.getUserDocuments).toHaveBeenCalledWith(
        query,
        MOCK_LOGGER_SERVICE,
      );
      expect(result).toBe('user-docs');
    });
  });
});
