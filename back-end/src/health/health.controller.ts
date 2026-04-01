import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@ApiTags('observability')
@Controller()
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('healthz')
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        uptime: 42,
        checks: { database: 'ok' },
        memory: { heapUsedMb: 64, heapTotalMb: 128, rssMb: 96 },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiServiceUnavailableResponse()
  async getHealth() {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startedAt) / 1000);
    const mem = process.memoryUsage();

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        uptime,
        checks: { database: 'error' },
        timestamp,
      });
    }

    return {
      status: 'ok',
      uptime,
      checks: { database: 'ok' },
      memory: {
        heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMb: +(mem.heapTotal / 1024 / 1024).toFixed(1),
        rssMb: +(mem.rss / 1024 / 1024).toFixed(1),
      },
      timestamp,
    };
  }
}
