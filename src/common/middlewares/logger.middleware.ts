import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import LoggerService from '../../common/utils/logging/loggerService';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Create a new LoggerService instance for each request
    const logger = new LoggerService(false);

    // Attach it to the request
    req.logger = logger;

    // End logging when response finishes
    res.on('finish', () => {
      logger.logEnd({ action: 'request has been end' });
    });
    next();
  }
}
