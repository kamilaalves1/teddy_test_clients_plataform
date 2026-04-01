import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('observability')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus metrics endpoint.
   * Scrape this with your Prometheus server:
   *   scrape_configs:
   *     - job_name: 'teddy-api'
   *       static_configs:
   *         - targets: ['localhost:3000']
   *       metrics_path: /metrics
   */
  @Get('metrics')
  @ApiExcludeEndpoint() // exclude from Swagger — consumed by Prometheus, not by clients
  async getMetrics(@Res() res: Response): Promise<void> {
    const [body, contentType] = await Promise.all([
      this.metricsService.getMetrics(),
      Promise.resolve(this.metricsService.getContentType()),
    ]);
    res.setHeader('Content-Type', contentType);
    res.end(body);
  }
}
