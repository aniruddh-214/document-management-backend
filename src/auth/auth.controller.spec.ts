import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    createUser: jest.fn(),
    login: jest.fn(),
    getUserProfile: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const mockRequest = {
    logger: mockLogger,
    user: { sub: 'user-id-123' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockRequest.user;
          req.logger = mockLogger;
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should call authService.createUser and return result', async () => {
      const dto = {
        fullName: 'Test',
        email: 'test@example.com',
        password: 'Pass123!',
      };
      const expected = { id: 'user-123', email: dto.email };
      mockAuthService.createUser.mockResolvedValue(expected);

      const result = await controller.register(mockRequest, dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.createUser).toHaveBeenCalledWith(dto, mockLogger);
    });
  });

  describe('login', () => {
    it('should call authService.login and return token', async () => {
      const dto = { email: 'test@example.com', password: 'Pass123!' };
      const expected = { accessToken: 'jwt-token' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(mockRequest, dto);

      expect(result).toEqual(expected);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, mockLogger);
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = controller.logout();
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile from authService', async () => {
      const expected = { id: 'user-id-123', email: 'test@example.com' };
      mockAuthService.getUserProfile.mockResolvedValue(expected);

      const result = await controller.getUserProfile(mockRequest);

      expect(result).toEqual(expected);
      expect(mockAuthService.getUserProfile).toHaveBeenCalledWith(
        'user-id-123',
        mockLogger,
      );
    });
  });
});
