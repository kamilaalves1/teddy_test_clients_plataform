import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { MetricsModule } from '../metrics/metrics.module';
import { ClientEntity } from './client.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity]), CommonModule, MetricsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
