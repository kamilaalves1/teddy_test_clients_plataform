import { Injectable, type LoggerService } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'verbose';

type LogEntry = {
  message: string;
  event?: string;
  outcome?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
};

@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly requestContext: RequestContextService) {}

  record(level: LogLevel, entry: LogEntry): void {
    const { message, ...rest } = entry;
    this.write(level, message, rest);
  }

  private write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const context = this.requestContext.get();
    const entry = JSON.stringify({
      level,
      message,
      requestId: context?.requestId,
      operation: context?.operation,
      userId: context?.userId,
      userEmail: context?.userEmail,
      clientId: context?.clientId,
      traceId: context?.traceId,
      spanId: context?.spanId,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    if (level === 'error') {
      process.stderr.write(entry + '\n');
    } else {
      process.stdout.write(entry + '\n');
    }
  }

  log(message: string, context?: string): void {
    this.write('info', message, context ? { context } : undefined);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', message, {
      ...(context ? { context } : {}),
      ...(trace ? { trace } : {}),
    });
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context ? { context } : undefined);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context ? { context } : undefined);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, context ? { context } : undefined);
  }
}
