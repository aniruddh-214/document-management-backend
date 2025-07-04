import { randomUUID } from 'crypto';
import LoggerService from './loggerService';
import logger from './logger';
import { LogError, LogInfo } from './types';

jest.mock('./logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('LoggerService', () => {
  let loggerService: LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should generate a requestId', () => {
      loggerService = new LoggerService();
      const requestId = (loggerService as any)._requestId;
      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
    });

    it('should call logBegin if forMainApplicationLogging is false', () => {
      const spy = jest.spyOn(LoggerService.prototype as any, 'logBegin');
      loggerService = new LoggerService(false);
      expect(spy).toHaveBeenCalledWith({
        action: 'Starting Logging',
        message: 'Request has been began.',
        source: 'LoggerService#logBegin',
      });
      spy.mockRestore();
    });
  });

  describe('logBegin', () => {
    it('should log default begin info if no data passed', () => {
      loggerService = new LoggerService();
      loggerService.logBegin({});
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Request has been began.',
            action: 'begin',
            source: 'LoggerService#logBegin',
          }),
        }),
      );
    });
  });

  describe('logEnd', () => {
    it('should call logInfo if no error is passed', () => {
      loggerService = new LoggerService();
      loggerService.logEnd({});
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Request has been completed.',
            action: 'end',
            source: 'LoggerService#logEnd',
          }),
        }),
      );
    });

    it('should call logError if error is passed', () => {
      const errorLog: LogError = {
        message: 'Failed',
        action: 'end',
        source: 'test',
        error: new Error('Something went wrong'),
      };
      loggerService = new LoggerService();
      loggerService.logEnd(errorLog);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('logInfo', () => {
    it('should call logger.info with formatted log', () => {
      loggerService = new LoggerService();
      const log: LogInfo = {
        message: 'Info test',
        action: 'testAction',
        source: 'testSource',
      };
      loggerService.logInfo(log);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Info test',
          }),
          labels: expect.any(Object),
        }),
      );
    });
  });

  describe('logError', () => {
    it('should call logger.error with formatted log', () => {
      loggerService = new LoggerService();
      const log: LogError = {
        message: 'Error test',
        action: 'testAction',
        source: 'testSource',
        error: new Error('Oops'),
      };
      loggerService.logError(log);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Error test',
          }),
          labels: expect.any(Object),
        }),
      );
    });
  });

  describe('logWarn', () => {
    it('should call logger.warn with formatted log', () => {
      loggerService = new LoggerService();
      loggerService.logWarn({ message: 'Warning!' });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Warning!',
          }),
        }),
      );
    });
  });

  describe('logDebug', () => {
    it('should call logger.debug with formatted log', () => {
      loggerService = new LoggerService();
      loggerService.logDebug({ message: 'Debugging!' });
      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Debugging!',
          }),
        }),
      );
    });
  });

  describe('_logDetails', () => {
    it('should return all defined fields in correct order', () => {
      loggerService = new LoggerService();
      const input = {
        message: 'Test message',
        errorMessage: 'Test error message',
        xRequestId: '1234',
        durationMs: 250,
        data: { userId: 1 },
        error: new Error('Oops'),
        action: 'TEST',
        errorStack: 'stacktrace',
        source: 'LoggerService#_logDetails',
      };

      const result = (loggerService as any)._logDetails(input);

      expect(result).toEqual(input);
      expect(Object.keys(result)).toEqual([
        'message',
        'errorMessage',
        'xRequestId',
        'durationMs',
        'data',
        'error',
        'action',
        'errorStack',
        'source',
      ]);
    });

    it('should exclude undefined fields', () => {
      loggerService = new LoggerService();
      const input = {};

      const result = (loggerService as any)._logDetails(input);
      expect(result).toEqual({});
    });
  });

  describe('logInfo -> _logDetails integration', () => {
    it('should log properly formatted info with selected fields', () => {
      loggerService = new LoggerService();

      const log: LogInfo = {
        message: 'Integration test',
        action: 'testAction',
        source: 'integrationTest',
      };

      loggerService.logInfo(log);

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            message: 'Integration test',
            action: 'testAction',
            source: 'integrationTest',
            xRequestId: expect.any(String),
          }),
        }),
      );
    });
  });
});
