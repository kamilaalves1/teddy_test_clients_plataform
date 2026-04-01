import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, type Response } from 'express';
import { AppLogger } from './app-logger.service';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Erro interno do servidor';

    if (exception instanceof HttpException) {
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (exResponse && typeof exResponse === 'object') {
        const msg = (exResponse as Record<string, unknown>).message;
        if (typeof msg === 'string' && msg.trim()) message = msg;
        if (Array.isArray(msg) && typeof msg[0] === 'string') message = msg[0];
      }
    } else if (exception instanceof Error && exception.message) {
      message = exception.message;
    }

    const body = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.record(status >= 500 ? 'error' : 'warn', {
      event: 'request.failed',
      message: `Falha em ${request.method} ${request.url}`,
      status: 'failure',
      metadata: {
        method: request.method,
        path: request.url,
        statusCode: status,
      },
      error: message,
    });

    response.status(status).json(body);
  }
}
