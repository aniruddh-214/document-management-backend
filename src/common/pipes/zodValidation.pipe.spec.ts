import { BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { ZodError, z } from 'zod';
import { RequestValidationPipe } from './zodValidation.pipe';

describe('RequestValidationPipe', () => {
  let pipe: RequestValidationPipe;

  const bodySchema = z.object({ name: z.string() });
  const querySchema = z.object({ limit: z.number() });
  const paramSchema = z.object({ id: z.string().uuid() });

  const schema = z.object({
    body: bodySchema,
    query: querySchema,
    param: paramSchema,
  });

  beforeEach(() => {
    pipe = new RequestValidationPipe(schema);
  });

  it('should validate and transform body correctly', () => {
    const value = { name: 'NestJS' };
    const metadata: ArgumentMetadata = {
      type: 'body',
      data: undefined,
    };

    expect(
      pipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });

  it('should validate and transform query correctly', () => {
    const value = { limit: 10 };
    const metadata: ArgumentMetadata = {
      type: 'query',
      data: undefined,
    };

    expect(
      pipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });

  it('should validate and transform param correctly', () => {
    const value = { id: 'a3bb189e-8bf9-3888-9912-ace4e6543002' };
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: undefined,
    };

    expect(
      pipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });

  it('should return value if schema shape for type is not defined', () => {
    // Pipe with schema missing 'query' shape
    const partialSchema = z.object({
      body: bodySchema,
      param: paramSchema,
    });
    const partialPipe = new RequestValidationPipe(partialSchema);

    const value = { limit: 10 };
    const metadata: ArgumentMetadata = {
      type: 'query',
      data: undefined,
    };

    expect(
      partialPipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });

  it('should throw BadRequestException on validation error', () => {
    const value = { name: 123 }; // invalid name (should be string)
    const metadata: ArgumentMetadata = {
      type: 'body',
      data: undefined,
    };

    try {
      pipe.transform(value as unknown as z.AnyZodObject, metadata);
      // fail test if no error is thrown
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.getStatus()).toBe(400);
      expect(err.getResponse()).toHaveProperty('message', 'Validation failed');
      expect(err.getResponse()).toHaveProperty('errors');
    }
  });

  it('should rethrow unexpected errors', () => {
    // Mock schema parse to throw unexpected error
    const error = new Error('Unexpected error');
    const faultySchema = {
      shape: {
        body: {
          parse: jest.fn(() => {
            throw error;
          }),
        },
      },
    } as any;

    const faultyPipe = new RequestValidationPipe(faultySchema);

    const value = { name: 'test' };
    const metadata: ArgumentMetadata = {
      type: 'body',
      data: undefined,
    };

    expect(() =>
      faultyPipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toThrow(error);
  });

  it('should return value if schema.shape.body is not defined', () => {
    // schema without 'body' shape
    const partialSchema = z.object({
      query: querySchema,
      param: paramSchema,
    });
    const partialPipe = new RequestValidationPipe(partialSchema);

    const value = { name: 'NestJS' };
    const metadata: ArgumentMetadata = {
      type: 'body',
      data: undefined,
    };

    expect(
      partialPipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });

  it('should return value if schema.shape.param is not defined', () => {
    // schema without 'param' shape
    const partialSchema = z.object({
      body: bodySchema,
      query: querySchema,
    });
    const partialPipe = new RequestValidationPipe(partialSchema);

    const value = { id: 'a3bb189e-8bf9-3888-9912-ace4e6543002' };
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: undefined,
    };

    expect(
      partialPipe.transform(value as unknown as z.AnyZodObject, metadata),
    ).toEqual(value);
  });
});
