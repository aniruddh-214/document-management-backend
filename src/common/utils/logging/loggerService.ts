import { randomUUID } from 'crypto';

import logger from './logger';
import { LogDetails, LogError, LogLabels, LogInfo } from './types';

/**
 * The logging utility for application logs
 * @class LoggerService
 */
export default class LoggerService {
  private _requestId: string;

  /**
   * Creates an instance of LoggerService.
   * @param {boolean} forMainApplicationLogging to check is logging required for main or request based
   * @memberof LoggerService
   */
  constructor(private readonly forMainApplicationLogging = true) {
    this._requestId = randomUUID();
    if (!this.forMainApplicationLogging) {
      this.logBegin({ action: 'Starting Logging' });
    }
  }

  /**
   * A helper for starting the process logging
   * @param {Partial<LogInfo>} logInfo
   * @memberof LoggerService
   */
  public logBegin(logInfo: Partial<LogInfo>): void {
    logInfo.message = logInfo.message ?? 'Request has been began.';
    logInfo.action = logInfo.action ?? 'begin';
    logInfo.source = logInfo.source ?? 'LoggerService#logBegin';
    this.logInfo(logInfo as LogInfo);
  }

  /**
   * A helper for logging ending for process
   * @param {Partial<LogDetails>} logInfo
   * @memberof LoggerService
   */
  public logEnd(logInfo: Partial<LogDetails>): void {
    logInfo.message = logInfo.message ?? 'Request has been completed.';
    logInfo.action = logInfo.action ?? 'end';
    logInfo.source = logInfo.source ?? 'LoggerService#logEnd';
    if (logInfo.error) {
      this.logError(logInfo as LogError);
    } else {
      this.logInfo(logInfo as LogInfo);
    }
  }

  /**
   *
   * A helper for logging information
   * @param {LogInfo} logInfo
   * @memberof LoggerService
   */
  public logInfo(logInfo: LogInfo): void {
    logger.info(this._getLogInfo(logInfo));
  }

  /**
   *
   * A helper for logging errors
   * @param {LogError} logInfo
   * @memberof LoggerService
   */
  public logError(logInfo: LogError): void {
    logger.error(this._getLogInfo(logInfo));
  }

  /**
   *
   * A helper for logging warnings
   * @param {Partial<LogDetails>} logInfo
   * @memberof LoggerService
   */
  public logWarn(logInfo: Partial<LogDetails>): void {
    logger.warn(this._getLogInfo(logInfo));
  }

  /**
   * A debugger using loggerService
   * @param {Partial<LogDetails>} logInfo
   * @memberof LoggerService
   */
  public logDebug(logInfo: Partial<LogDetails>): void {
    logger.debug(this._getLogInfo(logInfo));
  }

  /**
   *
   *
   * @private
   * @param {Partial<LogDetails>} logInfo
   * @returns {*}  {unknown}
   * @memberof LoggerService
   */
  private _getLogInfo(logInfo: Partial<LogDetails>): unknown {
    return {
      message: this._logDetails({ ...logInfo, xRequestId: this._requestId }),
      labels: this._logLabels(logInfo as LogDetails),
    };
  }

  /**
   *
   *
   * @private
   * @param {LogDetails} logInfo
   * @returns {*}  {LogLabels}
   * @memberof LoggerService
   */
  private _logLabels(logInfo: LogDetails): LogLabels {
    return {
      requestId: this._requestId,
      ...logInfo,
    };
  }

  /**
   * @private
   * @param {Partial<LogDetails>} logInfo
   * @returns {Partial<LogDetails>}  {Partial<LogDetails>}
   * @memberof LoggerService
   */
  private _logDetails(logInfo: Partial<LogDetails>): Partial<LogDetails> {
    // This function make sure order of fields so that it is easily readable.
    const logDetails: Partial<LogDetails> = {};

    if (logInfo.message !== undefined) {
      logDetails.message = logInfo.message;
    }

    if (logInfo.errorMessage !== undefined) {
      logDetails.errorMessage = logInfo.errorMessage;
    }

    if (logInfo.xRequestId !== undefined) {
      logDetails.xRequestId = logInfo.xRequestId;
    }

    if (logInfo.durationMs !== undefined) {
      logDetails.durationMs = logInfo.durationMs;
    }
    if (logInfo.data !== undefined) {
      logDetails.data = logInfo.data;
    }
    if (logInfo.error !== undefined) {
      logDetails.error = logInfo.error;
    }

    if (logInfo.action !== undefined) {
      logDetails.action = logInfo.action;
    }

    if (logInfo.errorStack !== undefined) {
      logDetails.errorStack = logInfo.errorStack;
    }

    if (logInfo.source !== undefined) {
      logDetails.source = logInfo.source;
    }

    return logDetails;
  }
}
