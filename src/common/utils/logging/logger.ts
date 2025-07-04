import {
  createLogger,
  format,
  transports,
  addColors,
  Logger,
  Logform,
} from 'winston';

import 'winston-daily-rotate-file';
import ENV from '../../../config/env.config';

const { combine, timestamp, json, colorize, printf } = format;

export const getFormattedTimestamp = (): { date: string; zone: string } => {
  const isProd = ENV.NODE_ENV === 'production';
  const now = isProd ? new Date(Date.now()) : new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = formatter.format(now);

  const timeZone = isProd
    ? 'UTC'
    : Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    date: dateStr,
    zone: timeZone,
  };
};

export const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  },
  colors: {
    trace: 'white',
    debug: 'blue',
    info: 'green',
    warn: 'yellow',
    error: 'red',
  },
};

const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, '');

const SKY_BLUE_256 = '\x1b[96m';
const RESET = '\x1b[0m';

export const consoleFormatterFn = ({
  level,
  message,
  stack,
}: {
  level: string;
  message: unknown;
  stack?: unknown;
}): string => {
  const pid = process.pid;
  const appName = ENV.APPLICATION_NAME;
  const { date, zone } = getFormattedTimestamp();

  const cleanLevel = stripAnsi(level);
  const numericLevel =
    logLevels.levels[cleanLevel as keyof typeof logLevels.levels] ?? 'UNKNOWN';

  const prefix = `${SKY_BLUE_256}[${appName}] ${pid} - ${date} TIMEZONE ${zone} | LogLevel: ${numericLevel} |${RESET}`;

  const output =
    typeof message === 'string' ? message : JSON.stringify(message, null, 2);

  const stackOutput =
    typeof stack === 'string'
      ? `\nStack: ${stack}`
      : stack !== undefined
        ? `\nStack: ${JSON.stringify(stack, null, 2)}`
        : '';

  return `\n${prefix} ${output}${stackOutput}`;
};

export const consoleFormat: Logform.Format = printf(consoleFormatterFn);

addColors(logLevels.colors);

const logger: Logger = createLogger({
  levels: logLevels.levels,
  level: 'trace',
  format: combine(timestamp(), json()),
  defaultMeta: { service: ENV.APPLICATION_NAME || 'Nest' },
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '30d',
    }),
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      datePattern: 'DD-MM-YYYY',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '30d',
    }),
  ],
});

if (ENV.SHOW_CONSOLE_LOG === true) {
  logger.add(
    new transports.Console({
      format: combine(colorize({ all: true }), consoleFormat),
    }),
  );
}

export default logger;
