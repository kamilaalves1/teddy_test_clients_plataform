import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

const makeDataSource = (fail = false) => ({
  query: jest
    .fn()
    .mockImplementation(() =>
      fail ? Promise.reject(new Error('DB down')) : Promise.resolve([{ '?column?': 1 }]),
    ),
});

describe('HealthController', () => {
  it('returns status ok when DB is reachable', async () => {
    const ctrl = new HealthController(makeDataSource() as never);
    const result = await ctrl.getHealth();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('includes uptime in seconds', async () => {
    const ctrl = new HealthController(makeDataSource() as never);
    const result = await ctrl.getHealth();
    expect(typeof result.uptime).toBe('number');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes memory metrics', async () => {
    const ctrl = new HealthController(makeDataSource() as never);
    const result = await ctrl.getHealth();
    expect(result.memory.heapUsedMb).toBeGreaterThan(0);
    expect(result.memory.heapTotalMb).toBeGreaterThan(0);
    expect(result.memory.rssMb).toBeGreaterThan(0);
  });

  it('throws ServiceUnavailableException when DB query fails', async () => {
    const ctrl = new HealthController(makeDataSource(true) as never);
    await expect(ctrl.getHealth()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('calls dataSource.query with SELECT 1', async () => {
    const ds = makeDataSource();
    const ctrl = new HealthController(ds as never);
    await ctrl.getHealth();
    expect(ds.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('includes a valid ISO timestamp', async () => {
    const ctrl = new HealthController(makeDataSource() as never);
    const before = Date.now();
    const result = await ctrl.getHealth();
    const after = Date.now();
    const ts = new Date(result.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
