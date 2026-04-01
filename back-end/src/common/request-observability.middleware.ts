import { Injectable, type NestMiddleware } from '@nestjs/common';
import { NextFunction, type Request, type Response } from 'express';
import { trace } from '@opentelemetry/api';
import { AppLogger } from './app-logger.service';
import { RequestContextService } from './request-context.service';
import { MetricsService } from '../metrics/metrics.service';

const IGNORED_PATHS = new Set(['/healthz', '/metrics', '/docs']);

function normalizeOperation(method: string, path: string): string {
  if (path.startsWith('/v1/auth/login')) return 'auth.login';
  if (path.startsWith('/v1/auth/register')) return 'auth.register';
  if (method === 'GET' && /^\/v1\/clients\/\d+$/.test(path)) return 'clients.detail';
  if (method === 'GET' && path.startsWith('/v1/clients')) return 'clients.list';
  if (method === 'POST' && path === '/v1/clients') return 'clients.create';
  if (method === 'PUT' && /^\/v1\/clients\/\d+$/.test(path)) return 'clients.update';
  if (method === 'DELETE' && /^\/v1\/clients\/\d+$/.test(path)) return 'clients.delete';
  return 'http.unknown';
}

@Injectable()
export class RequestObservabilityMiddleware implements NestMiddleware {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  use(
    req: Request & {
      correlationId?: string;
      user?: { id?: number; email?: string };
    },
    res: Response,
    next: NextFunction,
  ) {
    const path = req.originalUrl.split('?')[0];
    if (IGNORED_PATHS.has(path)) {
      next();
      return;
    }

    const startedAt = performance.now();
    const operation = normalizeOperation(req.method, path);
    const spanContext = trace.getActiveSpan()?.spanContext();

    this.metricsService.incrementActiveRequests();

    this.requestContext.run(
      {
        requestId: req.correlationId ?? 'unknown-request',
        operation,
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId,
      },
      () => {
        res.on('finish', () => {
          const durationSeconds = (performance.now() - startedAt) / 1000;

          this.requestContext.patch({
            userId: req.user?.id,
            userEmail: req.user?.email,
          });

          this.metricsService.recordHttpRequest(operation, res.statusCode, durationSeconds);
          this.metricsService.decrementActiveRequests();

          this.logger.record(res.statusCode >= 500 ? 'error' : 'info', {
            event: 'request.completed',
            message: `${operation} concluida`,
            status: res.statusCode >= 400 ? 'failure' : 'success',
            metadata: {
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
              durationMs: Math.round(durationSeconds * 1000),
            },
          });
        });

        next();
      },
    );
  }
}
