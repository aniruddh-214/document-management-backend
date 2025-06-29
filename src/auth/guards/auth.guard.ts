import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { JsonWebToken } from '../../common/utils/jsonwebtoken.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly _jwt: JsonWebToken) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    const logger = request.logger;

    if (!token) {
      throw new UnauthorizedException('Authorization token not found');
    }

    try {
      request.user = this._jwt.verifyJwtToken(token);
      return true;
    } catch (error) {
      logger.logWarn({
        message: `Invalid or expired token | Host:${request.host} and IP: ${request.ip}`,
        errorMessage: (error as Error).message,
        source: 'JwtAuthGuard#canActivate',
        action: 'warn',
      });
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
