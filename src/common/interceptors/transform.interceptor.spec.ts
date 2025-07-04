import { TransformInterceptor } from './transform.interceptor';

import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should transform the response correctly', (done) => {
    // Mock ExecutionContext
    const mockStatusCode = 201;
    const mockResponse = {
      statusCode: mockStatusCode,
    };
    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    // Mock CallHandler
    const responseData = { id: 123, name: 'test' };
    const mockCallHandler: CallHandler = {
      handle: () => of(responseData),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual({
        statusCode: mockStatusCode,
        data: responseData,
        message: 'Request successful',
      });
      done();
    });
  });
});
