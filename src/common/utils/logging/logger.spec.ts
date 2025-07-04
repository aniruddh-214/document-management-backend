import logger, {
  consoleFormatterFn,
  getFormattedTimestamp,
  logLevels,
} from './logger';
import { transports } from 'winston';
import ENV from '../../../config/env.config';

jest.mock('../../../config/env.config.ts', () => ({
  __esModule: true,
  default: {
    APPLICATION_NAME: 'TestApp',
    NODE_ENV: 'development',
    SHOW_CONSOLE_LOG: true,
  },
}));

describe('Logger', () => {
  describe('Logger Configuration', () => {
    it('should define custom log levels', () => {
      expect(logLevels.levels).toEqual({
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        trace: 4,
      });
    });

    it('should include both file transports', () => {
      const fileTransports = logger.transports.filter(
        (t) => t instanceof transports.DailyRotateFile,
      );
      expect(fileTransports.length).toBe(2);
    });

    it('should include console transport when SHOW_CONSOLE_LOG is true', () => {
      const consoleTransport = logger.transports.find(
        (t) => t instanceof transports.Console,
      );
      expect(consoleTransport).toBeDefined();
    });

    it('should log messages at each custom level', () => {
      const spy = jest.spyOn(logger, 'log');
      const levels = Object.keys(
        logLevels.levels,
      ) as (keyof typeof logLevels.levels)[];

      levels.forEach((level) => {
        logger.log(level, `Message at ${level}`);
        expect(spy).toHaveBeenCalledWith(level, `Message at ${level}`);
      });

      spy.mockRestore();
    });

    it('should log structured object messages correctly', () => {
      const spy = jest.spyOn(logger, 'info');
      const message = { user: 'john', action: 'login' };
      logger.info(message);
      expect(spy).toHaveBeenCalledWith(message);
      spy.mockRestore();
    });
  });

  describe('consoleFormatterFn', () => {
    it('should format a string message correctly', () => {
      const result = consoleFormatterFn({
        level: 'info',
        message: 'Test message',
      });

      expect(result).toContain('Test message');
      expect(result).toContain('[TestApp]');
      expect(result).toContain('LogLevel: 2');
    });

    it('should format an object message with a string stack', () => {
      const result = consoleFormatterFn({
        level: 'error',
        message: { event: 'crash', reason: 'unexpected' },
        stack: 'Error: crash',
      });

      expect(result).toContain('"event": "crash"');
      expect(result).toContain('Stack: Error: crash');
    });

    it('should stringify a stack object safely', () => {
      const result = consoleFormatterFn({
        level: 'error',
        message: 'Some error',
        stack: { code: 'E001', desc: 'Oops' },
      });

      expect(result).toContain('"desc": "Oops"');
      expect(result).toContain('Stack:');
    });
  });

  describe('getFormattedTimestamp in production', () => {
    it('should return UTC timestamp and timezone in production', () => {
      const temp = ENV.NODE_ENV;
      ENV.NODE_ENV = 'production';
      const result = getFormattedTimestamp();

      expect(result.zone).toBe('UTC');
      expect(typeof result.date).toBe('string');
      ENV.NODE_ENV = temp;
    });
  });

  it('should fall back to UNKNOWN for unrecognized log level', () => {
    const result = consoleFormatterFn({
      level: 'nonexistent',
      message: 'Testing unknown log level',
    });

    expect(result).toContain('LogLevel: UNKNOWN');
  });

  describe('logger defaultMeta fallback to Nest', () => {
    it('should fallback to "Nest" when ENV.APPLICATION_NAME is empty', async () => {
      jest.resetModules();

      // Mock the ENV module to override only APPLICATION_NAME
      jest.doMock('../../../config/env.config', () => {
        const actualEnv = jest.requireActual(
          '../../../config/env.config',
        ).default;
        return {
          __esModule: true,
          default: {
            ...actualEnv,
            APPLICATION_NAME: '',
          },
        };
      });

      const { default: logger } = await import('./logger');

      expect(logger.defaultMeta?.service).toBe('Nest');
    });
  });
});
