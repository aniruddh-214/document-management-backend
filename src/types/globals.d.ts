import { UserAuthTokenPayload } from '../auth/interfaces/jwtPayload.interface';
import LoggerService from '../common/utils/logging/loggerService';

// Extend Express.Request with custom properties
declare global {
  namespace Express {
    interface Request {
      user: UserAuthTokenPayload; // This will be available only after the use of  auth guards otherwise undefined
      logger: LoggerService;
      context: Record<string, any>;
    }
  }
}

export {};
