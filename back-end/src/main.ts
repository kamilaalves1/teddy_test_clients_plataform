import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppLogger } from './common/app-logger.service';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { setupSwagger } from './swagger';
import { shutdownTelemetry } from './telemetry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  app.setGlobalPrefix('v1', { exclude: ['healthz', 'metrics', 'docs'] });

  app.enableShutdownHooks();

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  logger.record('info', {
    event: 'application.started',
    message: 'API iniciada com sucesso',
    status: 'success',
    metadata: {
      host,
      port,
      docs: `http://localhost:${port}/docs`,
    },
  });

  const stopTelemetry = async () => {
    await shutdownTelemetry();
  };

  process.once('SIGTERM', () => void stopTelemetry());
  process.once('SIGINT', () => void stopTelemetry());
}

bootstrap();
