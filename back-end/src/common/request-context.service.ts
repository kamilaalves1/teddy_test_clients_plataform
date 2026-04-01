import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextData = {
  requestId: string;
  operation: string;
  userId?: number;
  userEmail?: string;
  clientId?: number;
  traceId?: string;
  spanId?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextData>();

  run<T>(context: RequestContextData, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RequestContextData | undefined {
    return this.storage.getStore();
  }

  patch(values: Partial<RequestContextData>): void {
    const current = this.storage.getStore();
    if (!current) {
      return;
    }

    Object.assign(current, values);
  }
}
