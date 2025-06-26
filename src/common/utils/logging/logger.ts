import { createLogger, format, transports, addColors } from 'winston';
import 'winston-daily-rotate-file';

import ENV from '../../../config/env.config';

const { combine, timestamp, json, colorize, printf } = format;

const getFormattedTimestamp = (): { date: string; zone: string } => {
  const isProd = ENV.NODE_ENV === 'production';
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = isProd
    ? formatter.format(new Date(now.toUTCString()))
    : formatter.format(now);

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

const consoleFormat = printf(({ level, message, stack }) => {
  const pid = process.pid;
  const appName = ENV.APPLICATION_NAME;
  const { date, zone } = getFormattedTimestamp();

  const cleanLevel = stripAnsi(level);
  const numericLevel =
    logLevels.levels[cleanLevel as keyof typeof logLevels.levels] ?? 'UNKNOWN';

  const prefix = `${SKY_BLUE_256}[${appName}] ${pid}  - ${date} TIMEZONE ${zone} | LogLevel: ${numericLevel} |${RESET}`;

  const output =
    typeof message === 'object' ? JSON.stringify(message, null, 2) : message;

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
  return `\n${prefix} ${output}${stack ? `\nStack: ${stack}` : ''}`;
});

addColors(logLevels.colors);

const logger = createLogger({
  levels: logLevels.levels,
  level: 'trace',
  format: combine(timestamp(), json()),
  defaultMeta: { service: process.env.APPLICATION_NAME || 'Nest' },
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

if (process.env.SHOW_CONSOLE_LOG === 'true') {
  logger.add(
    new transports.Console({
      format: combine(colorize({ all: true }), consoleFormat),
    }),
  );
}

export default logger;
