import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { CorrelationIdMiddleware } from './common/correlation-id.middleware';
import { CommonModule } from './common/common.module';
import { RequestObservabilityMiddleware } from './common/request-observability.middleware';
import { databaseConfig } from './config/database.config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    CommonModule,
    AuthModule,
    ClientsModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, RequestObservabilityMiddleware).forRoutes('*path');
  }
}
