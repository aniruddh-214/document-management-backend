import { AllExceptionsFilter } from './allExceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

// Import the logger factory module to mock
import * as loggerFactory from '../utils/logging/loggerFactory';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockLogger: { logError: jest.Mock };
  let mockHost: any;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    // Create a mock logger object with logError mocked
    mockLogger = {
      logError: jest.fn(),
    };

    // Spy on GlobalAppLogger and mock its return value
    jest
      .spyOn(loggerFactory, 'GlobalAppLogger')
      .mockReturnValue(mockLogger as any);

    // Instantiate filter WITHOUT passing logger manually
    // It will call the mocked GlobalAppLogger internally
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test-url',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle HttpException correctly', () => {
    const message = 'Forbidden error';
    const exception = new HttpException(message, HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message,
        action: 'exception',
        source: 'AllExceptionsFilter',
        path: '/test-url',
        statusCode: HttpStatus.FORBIDDEN,
      }),
    );

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test-url',
        message,
      }),
    );
  });

  it('should handle non-HttpException errors with 500 status', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost);

    expect(mockLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
        action: 'exception',
        source: 'AllExceptionsFilter',
        path: '/test-url',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    );

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/test-url',
        message: 'Internal server error',
      }),
    );
  });

  it('should handle HttpException with object response', () => {
    const exceptionResponse = { error: 'Unauthorized', statusCode: 401 };
    const exception = new HttpException(
      exceptionResponse,
      HttpStatus.UNAUTHORIZED,
    );

    filter.catch(exception, mockHost);

    expect(mockLogger.logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: JSON.stringify(exceptionResponse),
        action: 'exception',
        source: 'AllExceptionsFilter',
        path: '/test-url',
        statusCode: HttpStatus.UNAUTHORIZED,
      }),
    );

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        path: '/test-url',
        message: exceptionResponse,
      }),
    );
  });
});
