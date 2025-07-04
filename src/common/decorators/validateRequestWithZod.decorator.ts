/* istanbul ignore file */

import { UsePipes } from '@nestjs/common';
import { AnyZodObject } from 'zod';

import { RequestValidationPipe } from '../pipes/zodValidation.pipe';

export const ValidateRequest = (
  schema: AnyZodObject,
): ClassDecorator & MethodDecorator =>
  UsePipes(new RequestValidationPipe(schema));
