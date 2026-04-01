import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../common/app-logger.service';
import { RequestContextService } from '../common/request-context.service';
import { MetricsService } from '../metrics/metrics.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientEntity } from './client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repo: Repository<ClientEntity>,
    private readonly metricsService: MetricsService,
    private readonly logger: AppLogger,
    private readonly requestContext: RequestContextService,
  ) {}

  async create(dto: CreateClientDto) {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      this.logger.record('warn', {
        event: 'client.create',
        message: 'Nome de cliente já em uso',
        outcome: 'rejected',
        clientName: dto.name,
        duplicatedId: existing.id,
      });
      throw new ConflictException(`Já existe um cliente cadastrado com o nome "${dto.name}".`);
    }

    const client = this.repo.create({
      name: dto.name,
      salary: dto.salary,
      companyValue: dto.companyValue,
    });

    const savedClient = await this.repo.save(client);

    this.requestContext.patch({ clientId: savedClient.id });
    this.metricsService.recordClientMutation('create');
    this.logger.record('info', {
      event: 'client.created',
      message: `Cliente ${savedClient.name} criado`,
      clientId: savedClient.id,
    });

    return savedClient;
  }

  async findAll(page: number, limit: number) {
    const startedAt = performance.now();
    const [data, total] = await this.repo.findAndCount({
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.metricsService.recordClientList((performance.now() - startedAt) / 1000);
    this.logger.record('info', {
      message: 'Lista de clientes consultada',
      page,
      limit,
      total,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const startedAt = performance.now();
    const client = await this.repo.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Cliente ${id} não encontrado`);
    }

    client.accessCount += 1;
    const updatedClient = await this.repo.save(client);

    this.requestContext.patch({ clientId: updatedClient.id });
    this.metricsService.recordClientDetailView((performance.now() - startedAt) / 1000);
    this.logger.record('info', {
      message: 'Cliente consultado',
      clientId: updatedClient.id,
      accessCount: updatedClient.accessCount,
    });

    return updatedClient;
  }

  async update(id: number, dto: UpdateClientDto) {
    const client = await this.repo.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Cliente ${id} não encontrado`);
    }

    Object.assign(client, dto);
    const updatedClient = await this.repo.save(client);

    this.requestContext.patch({ clientId: updatedClient.id });
    this.metricsService.recordClientMutation('update');
    this.logger.record('info', {
      event: 'client.updated',
      message: 'Cadastro de cliente atualizado',
      clientId: updatedClient.id,
      changedFields: Object.keys(dto),
    });

    return updatedClient;
  }

  async remove(id: number) {
    const client = await this.repo.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Cliente ${id} não encontrado`);
    }

    await this.repo.softDelete(id);

    this.requestContext.patch({ clientId: id });
    this.metricsService.recordClientMutation('delete');
    this.logger.record('info', {
      message: 'Cliente removido da base ativa',
      clientId: id,
      clientName: client.name,
    });

    return { success: true, clientId: id, message: 'Cliente removido com sucesso' };
  }
}
