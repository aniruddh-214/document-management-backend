import LoggerFactory, { GlobalAppLogger } from './loggerFactory';
import LoggerService from './loggerService';

jest.mock('./loggerService');

describe('LoggerFactory', () => {
  beforeEach(() => {
    // Reset the private loggerInstance before each test
    // @ts-expect-error: Accessing private static for testing
    LoggerFactory.loggerInstance = null;
  });

  describe('getLogger', () => {
    it('throws error if logger is not initialized', () => {
      expect(() => LoggerFactory.getLogger()).toThrow(
        'Logger has not been initialized. Please call LoggerFactory.createLogger() before accessing the logger.',
      );
    });

    it('returns the logger instance if initialized', () => {
      const logger = LoggerFactory.createLogger();
      const retrievedLogger = LoggerFactory.getLogger();
      expect(retrievedLogger).toBe(logger);
      expect(retrievedLogger).toBeInstanceOf(LoggerService);
    });
  });

  describe('createLogger', () => {
    it('creates and returns a new LoggerService instance', () => {
      const logger = LoggerFactory.createLogger();
      expect(logger).toBeInstanceOf(LoggerService);
      expect(LoggerFactory.getLogger()).toBe(logger);
    });

    it('overwrites the previous logger instance', () => {
      const firstLogger = LoggerFactory.createLogger();
      const secondLogger = LoggerFactory.createLogger();
      expect(secondLogger).not.toBe(firstLogger);
      expect(LoggerFactory.getLogger()).toBe(secondLogger);
    });
  });
});

describe('GlobalAppLogger', () => {
  jest.mock('./loggerService');
  it('returns the singleton logger instance', () => {
    const MockedLoggerService = LoggerService as jest.MockedClass<
      typeof LoggerService
    >;

    const mockInstance = new MockedLoggerService(true);

    MockedLoggerService.mockImplementation(() => mockInstance);

    const loggerFromFactory = LoggerFactory.createLogger();
    const globalLogger = GlobalAppLogger();

    expect(globalLogger).toBe(loggerFromFactory);
  });
});
