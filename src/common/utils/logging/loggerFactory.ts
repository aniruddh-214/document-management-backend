import LoggerService from './loggerService';

/**
 * LoggerFactory provides a singleton instance of LoggerService
 * that can be used throughout the application.
 */
export default class LoggerFactory {
  private static loggerInstance: LoggerService | null = null;

  /**
   * Returns the existing LoggerService instance.
   * You must call `createLogger()` before calling this method.
   * @throws {Error} If logger has not been initialized
   * @returns {LoggerService} A singleton of custom logger
   */
  public static getLogger(): LoggerService {
    if (!LoggerFactory.loggerInstance) {
      throw new Error(
        'Logger has not been initialized. Please call LoggerFactory.createLogger() before accessing the logger.',
      );
    }
    return LoggerFactory.loggerInstance;
  }

  /**
   * Creates and returns a singleton instance of LoggerService.
   * If already created, it will overwrite the previous instance.
   * @returns {LoggerService} - Creates singleton for logger
   */
  public static createLogger(): LoggerService {
    LoggerFactory.loggerInstance = new LoggerService(true);
    return LoggerFactory.loggerInstance;
  }
}

/**
 * Immediately create the global logger instance at import time.
 */
LoggerFactory.createLogger();

/**
 * Global logger accessor for easy access anywhere in the app.
 * @example
 * GlobalAppLogger().info('Log something');
 * @returns {LoggerService} - singleton logger
 */
export const GlobalAppLogger = (): LoggerService => LoggerFactory.getLogger();
