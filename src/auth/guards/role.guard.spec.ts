import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './role.guard';
import UserRoleEnum from '../../common/enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockRequest = (user: any = null) => ({
    user,
  });

  const mockContext = (user: any = null): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => mockRequest(user),
      }),
      getHandler: () => 'testHandler',
      getClass: () => 'testClass',
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = mockReflector as unknown as Reflector;
    guard = new RolesGuard(reflector);
    jest.clearAllMocks();
  });

  it('should return true if no roles are required', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = mockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has the required role', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRoleEnum.ADMIN,
    ]);

    const context = mockContext({
      id: 'user-1',
      role: UserRoleEnum.ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user does not have required role', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRoleEnum.ADMIN,
    ]);

    const context = mockContext({
      id: 'user-1',
      role: UserRoleEnum.VIEWER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if no user on request', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRoleEnum.ADMIN,
    ]);

    const context = mockContext(null); // No user

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
