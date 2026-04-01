import { RequestObservabilityMiddleware } from './request-observability.middleware';

function makeResMock() {
  const listeners: Record<string, () => void> = {};
  return {
    on: jest.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    statusCode: 200,
    emit: (event: string) => listeners[event]?.(),
  };
}

function makeReqMock(overrides = {}) {
  return {
    method: 'GET',
    path: '/clients',
    originalUrl: '/clients',
    route: { path: '/clients' },
    correlationId: 'test-correlation-id',
    ...overrides,
  };
}

const mockMetrics = {
  recordHttpRequest: jest.fn(),
  incrementActiveRequests: jest.fn(),
  decrementActiveRequests: jest.fn(),
};

const mockRequestContext = {
  run: jest.fn((context, callback) => callback()),
  patch: jest.fn(),
};

const mockLogger = {
  record: jest.fn(),
};

describe('RequestObservabilityMiddleware', () => {
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('calls next immediately', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    const next = jest.fn();
    middleware.use(makeReqMock() as never, res as never, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('increments active requests on start', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(makeReqMock() as never, res as never, jest.fn());
    expect(mockMetrics.incrementActiveRequests).toHaveBeenCalledTimes(1);
  });

  it('increments metrics on response finish', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(makeReqMock() as never, res as never, jest.fn());
    res.emit('finish');
    expect(mockMetrics.recordHttpRequest).toHaveBeenCalledWith(
      'http.unknown',
      200,
      expect.any(Number),
    );
  });

  it('decrements active requests on response finish', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(makeReqMock() as never, res as never, jest.fn());
    res.emit('finish');
    expect(mockMetrics.decrementActiveRequests).toHaveBeenCalledTimes(1);
  });

  it('writes JSON log to stdout on response finish', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(makeReqMock() as never, res as never, jest.fn());
    res.emit('finish');
    expect(mockLogger.record).toHaveBeenCalledWith(
      'info',
      expect.objectContaining({ event: 'request.completed' }),
    );
  });

  it('includes correlationId in the log entry', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(makeReqMock({ correlationId: 'abc-123' }) as never, res as never, jest.fn());
    res.emit('finish');
    expect(mockRequestContext.run).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'abc-123' }),
      expect.any(Function),
    );
  });

  it('ignores health endpoints', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    const next = jest.fn();
    middleware.use(makeReqMock({ originalUrl: '/metrics' }) as never, res as never, next);
    expect(mockMetrics.incrementActiveRequests).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs error level for 5xx responses', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    res.statusCode = 500;
    middleware.use(makeReqMock() as never, res as never, jest.fn());
    res.emit('finish');
    expect(mockLogger.record).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ event: 'request.completed' }),
    );
  });

  it('normalizes business operations', () => {
    const middleware = new RequestObservabilityMiddleware(
      mockMetrics as never,
      mockRequestContext as never,
      mockLogger as never,
    );
    const res = makeResMock();
    middleware.use(
      makeReqMock({
        method: 'GET',
        path: '/v1/clients',
        originalUrl: '/v1/clients?page=1',
        route: { path: '/clients' },
      }) as never,
      res as never,
      jest.fn(),
    );
    res.emit('finish');
    expect(mockMetrics.recordHttpRequest).toHaveBeenCalledWith(
      'clients.list',
      200,
      expect.any(Number),
    );
  });
});
