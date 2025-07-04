import { Request } from 'express';
import UserController from './user.controller';
import UserService from './user.service';
import {
  GetAllUSersRequestQueryType,
  GetUserDocumentsRequestQueryType,
  UpdateUserDetailsRequestBodyType,
} from './schemas/request/user.schema';
import { DatabaseSortingOrder } from '../common/enums/dbOrderSort.enum';
import UserRoleEnum from '../common/enums/role.enum';

describe('UserController', () => {
  let controller: UserController;
  let service: Partial<UserService>;

  beforeEach(() => {
    service = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUserDetails: jest.fn(),
      deleteUserById: jest.fn(),
      getUserDocuments: jest.fn(),
    };

    controller = new UserController(service as UserService);
  });

  describe('getAllUsers', () => {
    it('should return all users with pagination/filter', async () => {
      const query: GetAllUSersRequestQueryType = {
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.ASC,
        select: [],
      };
      const req = { logger: {} } as Request;
      const expected = {
        users: [{ id: 'u1' }],
        totalCount: 1,
        totalPages: 1,
      };

      (service.getAllUsers as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getAllUsers(req, query);

      expect(service.getAllUsers).toHaveBeenCalledWith(
        expect.anything(),
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('getUserDetailsById', () => {
    it('should return single user details', async () => {
      const param = { id: 'user123' };
      const req = { logger: {} } as Request;
      const expected = { id: 'user123', name: 'John' };

      (service.getUserById as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getUserDetailsById(req, param);

      expect(service.getUserById).toHaveBeenCalledWith(param.id, req.logger);
      expect(result).toBe(expected);
    });
  });

  describe('updateUserDetails', () => {
    it('should update user and return success message', async () => {
      const param = { id: 'user123' };
      const body: UpdateUserDetailsRequestBodyType = {
        role: UserRoleEnum.ADMIN,
      };
      const req = { logger: {} } as Request;
      const expected = { message: 'User updated successfully' };

      (service.updateUserDetails as jest.Mock).mockResolvedValue(expected);

      const result = await controller.updateUserDetails(req, param, body);

      expect(service.updateUserDetails).toHaveBeenCalledWith(
        param.id,
        body,
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });

  describe('deleteUserById', () => {
    it('should soft delete user and return message', async () => {
      const param = { id: 'user123' };
      const req = { logger: {} } as Request;
      const expected = { message: 'User deleted' };

      (service.deleteUserById as jest.Mock).mockResolvedValue(expected);

      const result = await controller.deleteUserById(req, param);

      expect(service.deleteUserById).toHaveBeenCalledWith(param.id, req.logger);
      expect(result).toBe(expected);
    });
  });

  describe('getUserAllDocuments', () => {
    it('should return user documents for current user', async () => {
      const query: GetUserDocumentsRequestQueryType = {
        page: 1,
        limit: 10,
        sortOrder: DatabaseSortingOrder.ASC,
      };
      const req = {
        user: { sub: 'user123', role: 'editor' },
        logger: {},
      } as unknown as Request;

      const expected = {
        documents: [{ id: 'doc1' }],
        totalCount: 1,
        totalPages: 1,
      };

      (service.getUserDocuments as jest.Mock).mockResolvedValue(expected);

      const result = await controller.getUserAllDocuments(req, query);

      expect(service.getUserDocuments).toHaveBeenCalledWith(
        req.user,
        expect.anything(),
        req.logger,
      );
      expect(result).toBe(expected);
    });
  });
});
