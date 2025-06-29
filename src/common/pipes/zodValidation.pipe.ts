import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodError, AnyZodObject } from 'zod';

@Injectable()
export class RequestValidationPipe implements PipeTransform {
  constructor(private schema: AnyZodObject) {}

  transform(value: AnyZodObject, metadata: ArgumentMetadata): any {
    try {
      const { type } = metadata;

      switch (type) {
        case 'body':
          if (this.schema.shape.body) {
            return this.schema.shape.body.parse(value);
          }
          break;
        case 'query':
          if (this.schema.shape.query) {
            return this.schema.shape.query.parse(value);
          }
          break;
        case 'param':
          if (this.schema.shape.param) {
            return this.schema.shape.param.parse(value);
          }
          break;
      }

      return value;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: error.errors,
        });
      }
      throw error; // Rethrow unexpected errors
    }
  }
}
