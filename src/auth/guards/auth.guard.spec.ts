import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { JsonWebToken } from '../../common/utils/jsonwebtoken.util';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtUtil: JsonWebToken;

  const mockLogger = {
    logWarn: jest.fn(),
  };

  const mockRequest = (headers: Record<string, string> = {}, user = null) => ({
    headers,
    logger: mockLogger,
    host: 'localhost',
    ip: '127.0.0.1',
    user,
  });

  const mockContext = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as any;

  beforeEach(() => {
    jwtUtil = {
      verifyJwtToken: jest.fn(),
    } as unknown as JsonWebToken;

    guard = new JwtAuthGuard(jwtUtil);
    jest.clearAllMocks();
  });

  it('should allow access when token is valid', () => {
    const tokenPayload = { sub: 'user-id-123' };
    (jwtUtil.verifyJwtToken as jest.Mock).mockReturnValue(tokenPayload);

    const req = mockRequest({
      authorization: 'Bearer valid.jwt.token',
    });
    const context = mockContext(req);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtUtil.verifyJwtToken).toHaveBeenCalledWith('valid.jwt.token');
    expect(req.user).toEqual(tokenPayload);
  });

  it('should throw UnauthorizedException if no Authorization header', () => {
    const req = mockRequest(); // no headers
    const context = mockContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if malformed Authorization header', () => {
    const req = mockRequest({ authorization: 'InvalidHeader' });
    const context = mockContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token verification fails', () => {
    (jwtUtil.verifyJwtToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token expired');
    });

    const req = mockRequest({ authorization: 'Bearer bad.token.value' });
    const context = mockContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(mockLogger.logWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Invalid or expired token'),
        errorMessage: 'Token expired',
        source: 'JwtAuthGuard#canActivate',
      }),
    );
  });
});
