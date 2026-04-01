import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

type AuthFailureReason = 'invalid_credentials' | 'duplicate_email' | 'unauthorized';
type ClientMutationAction = 'create' | 'update' | 'delete';

@Injectable()
export class MetricsService {
  readonly register = new Registry();

  private readonly httpRequests = new Counter({
    name: 'teddy_http_requests_total',
    help: 'Total HTTP requests by operation and status code',
    labelNames: ['operation', 'status_code'] as const,
    registers: [this.register],
  });

  private readonly httpDuration = new Histogram({
    name: 'teddy_http_request_duration_seconds',
    help: 'HTTP request duration in seconds by operation',
    labelNames: ['operation', 'status_code'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.register],
  });

  private readonly activeRequests = new Gauge({
    name: 'teddy_http_active_requests',
    help: 'HTTP requests currently in-flight',
    registers: [this.register],
  });

  private readonly authAttempts = new Counter({
    name: 'teddy_auth_attempts_total',
    help: 'Authentication attempts by operation and outcome',
    labelNames: ['operation', 'outcome'] as const,
    registers: [this.register],
  });

  private readonly authFailures = new Counter({
    name: 'teddy_auth_failures_total',
    help: 'Authentication failures by operation and reason',
    labelNames: ['operation', 'reason'] as const,
    registers: [this.register],
  });

  private readonly clientMutations = new Counter({
    name: 'teddy_client_mutations_total',
    help: 'Successful client write operations by action',
    labelNames: ['action'] as const,
    registers: [this.register],
  });

  private readonly clientDetailViews = new Counter({
    name: 'teddy_client_detail_views_total',
    help: 'Successful client detail views',
    registers: [this.register],
  });

  private readonly clientsListed = new Counter({
    name: 'teddy_clients_list_total',
    help: 'Client list queries performed successfully',
    registers: [this.register],
  });

  private readonly clientListDuration = new Histogram({
    name: 'teddy_clients_list_duration_seconds',
    help: 'Client list query duration in seconds',
    buckets: [0.01, 0.03, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [this.register],
  });

  private readonly clientDetailDuration = new Histogram({
    name: 'teddy_client_detail_duration_seconds',
    help: 'Client detail query duration in seconds',
    buckets: [0.01, 0.03, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [this.register],
  });

  constructor() {
    this.register.setDefaultLabels({
      service: process.env.OTEL_SERVICE_NAME ?? 'teddy-api',
      environment: process.env.NODE_ENV ?? 'development',
    });

    collectDefaultMetrics({
      register: this.register,
    });
  }

  recordHttpRequest(operation: string, statusCode: number, durationSeconds: number): void {
    const labels = { operation, status_code: String(statusCode) };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationSeconds);
  }

  incrementActiveRequests(): void {
    this.activeRequests.inc();
  }

  decrementActiveRequests(): void {
    this.activeRequests.dec();
  }

  recordLoginSuccess(): void {
    this.authAttempts.inc({ operation: 'login', outcome: 'success' });
  }

  recordLoginFailure(
    reason: Exclude<AuthFailureReason, 'duplicate_email'> = 'invalid_credentials',
  ): void {
    this.authAttempts.inc({ operation: 'login', outcome: 'failure' });
    this.authFailures.inc({ operation: 'login', reason });
  }

  recordRegisterSuccess(): void {
    this.authAttempts.inc({ operation: 'register', outcome: 'success' });
  }

  recordRegisterFailure(
    reason: Extract<AuthFailureReason, 'duplicate_email'> = 'duplicate_email',
  ): void {
    this.authAttempts.inc({ operation: 'register', outcome: 'failure' });
    this.authFailures.inc({ operation: 'register', reason });
  }

  recordClientMutation(action: ClientMutationAction): void {
    this.clientMutations.inc({ action });
  }

  recordClientList(durationSeconds?: number): void {
    this.clientsListed.inc();
    if (durationSeconds !== undefined) {
      this.clientListDuration.observe(durationSeconds);
    }
  }

  recordClientDetailView(durationSeconds?: number): void {
    this.clientDetailViews.inc();
    if (durationSeconds !== undefined) {
      this.clientDetailDuration.observe(durationSeconds);
    }
  }

  getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
