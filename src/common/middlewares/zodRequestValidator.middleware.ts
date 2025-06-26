import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

import { IValidationSchema } from '../interfaces/zodValidation.interface';

@Injectable()
export class ZodValidationMiddleware implements NestMiddleware {
  constructor(private schema: AnyZodObject) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const validationSchema: IValidationSchema = {
      body: this.schema.shape.body,
      query: this.schema.shape.query,
      params: this.schema.shape.params,
      headers: this.schema.shape.headers,
      files: this.schema.shape.files,
    };

    try {
      req.files = req.files || {};

      if (validationSchema.body) {
        req.body = validationSchema.body.parse(req.body);
      }
      if (validationSchema.query) {
        req.query = validationSchema.query.parse(req.query);
      }
      if (validationSchema.params) {
        req.params = validationSchema.params.parse(req.params);
      }
      if (validationSchema.headers) {
        req.headers = validationSchema.headers.parse(req.headers);
      }
      if (validationSchema.files) {
        req.files = validationSchema.files.parse(req.files);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          errors: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  }
}
