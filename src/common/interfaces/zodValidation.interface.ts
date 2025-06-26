import { AnyZodObject } from 'zod';

export interface IValidationSchema {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
  headers?: AnyZodObject;
  files?: AnyZodObject;
}
