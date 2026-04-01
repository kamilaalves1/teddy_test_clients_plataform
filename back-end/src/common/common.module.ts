import { Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { HttpExceptionFilter } from './http-exception.filter';
import { RequestContextService } from './request-context.service';

@Module({
  providers: [RequestContextService, AppLogger, HttpExceptionFilter],
  exports: [RequestContextService, AppLogger, HttpExceptionFilter],
})
export class CommonModule {}
