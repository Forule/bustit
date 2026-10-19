import type { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { Env } from '../config/index.js';
import { requestIdFormat } from './request-id.format.js';

export type LoggerOptions = {
  level: Env['LOG_LEVEL'];
  dir: Env['LOG_DIR'];
};

/*
 * Console output is meant for humans watching the process, the rotated files
 * are meant for later analysis and therefore written as JSON with every field
 * of the record, including the request id.
 */
export function createLogger({ level, dir }: LoggerOptions): LoggerService {
  return WinstonModule.createLogger({
    level,
    format: requestIdFormat(),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(
            ({ timestamp, level, message, context, stack }) =>
              `[${String(timestamp)}] [${level}][${String(context)}]: ${String(message)}${typeof stack === 'string' ? `\n${stack}` : ''}`,
          ),
        ),
      }),
      new DailyRotateFile({
        filename: `${dir}/bustit-server-%DATE%`,
        extension: '.log',
        auditFile: `${dir}/.bustit-server-audit.json`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    ],
  });
}
