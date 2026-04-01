import { Injectable, type NestMiddleware } from '@nestjs/common';
import { NextFunction, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request & { correlationId?: string }, res: Response, next: NextFunction) {
    const id = (req.headers[CORRELATION_ID_HEADER] as string | undefined) ?? randomUUID();

    req.correlationId = id;
    res.setHeader(CORRELATION_ID_HEADER, id);

    next();
  }
}
