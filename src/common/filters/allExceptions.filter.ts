import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { GlobalAppLogger } from '../utils/logging/loggerFactory';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger = GlobalAppLogger()) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.logError({
      message: typeof message === 'string' ? message : JSON.stringify(message),
      action: 'exception',
      source: 'AllExceptionsFilter',
      path: request.url,
      statusCode: status,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
