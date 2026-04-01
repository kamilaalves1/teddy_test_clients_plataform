import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppLogger } from '../common/app-logger.service';
import { RequestContextService } from '../common/request-context.service';
import { MetricsService } from '../metrics/metrics.service';
import { ClientEntity } from './client.entity';
import { ClientsService } from './clients.service';

const repoMock = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
};

const metricsService = {
  recordClientMutation: jest.fn(),
  recordClientList: jest.fn(),
  recordClientDetailView: jest.fn(),
} as unknown as MetricsService;

const logger = {
  record: jest.fn(),
} as unknown as AppLogger;

const requestContext = {
  patch: jest.fn(),
} as unknown as RequestContextService;

const service = new ClientsService(repoMock as never, metricsService, logger, requestContext);

describe('ClientsService', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockClient = (): ClientEntity =>
    ({ id: 1, name: 'Test', salary: 1000, companyValue: 5000, accessCount: 0 }) as ClientEntity;

  describe('create', () => {
    it('cria um cliente e registra a mutação', async () => {
      const dto = { name: 'Test', salary: 1000, companyValue: 5000 };
      (repoMock.findOne as jest.Mock).mockResolvedValue(null);
      (repoMock.create as jest.Mock).mockReturnValue({ id: 1, ...dto });
      (repoMock.save as jest.Mock).mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(result).toMatchObject({ id: 1, name: 'Test' });
      expect(metricsService.recordClientMutation).toHaveBeenCalledWith('create');
      expect(logger.record).toHaveBeenCalledWith(
        'info',
        expect.objectContaining({ event: 'client.created', clientId: 1 }),
      );
    });

    it('não tenta salvar quando o nome já existe', async () => {
      const dto = { name: 'Test', salary: 1000, companyValue: 5000 };
      (repoMock.findOne as jest.Mock).mockResolvedValue(mockClient());

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);

      expect(repoMock.create).not.toHaveBeenCalled();
      expect(logger.record).toHaveBeenCalledWith(
        'warn',
        expect.objectContaining({ event: 'client.create', duplicatedId: 1 }),
      );
    });
  });

  describe('findAll', () => {
    it('usa a paginação pedida e devolve o pacote esperado', async () => {
      (repoMock.findAndCount as jest.Mock).mockResolvedValue([[mockClient()], 1]);

      const result = await service.findAll(1, 16);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(16);
      expect(repoMock.findAndCount).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        skip: 0,
        take: 16,
      });
      expect(metricsService.recordClientList).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('incrementa accessCount quando o cliente é consultado', async () => {
      const client = mockClient();
      (repoMock.findOne as jest.Mock).mockResolvedValue(client);
      (repoMock.save as jest.Mock).mockResolvedValue({ ...client, accessCount: 1 });

      const result = await service.findOne(1);

      expect(result.accessCount).toBe(1);
      expect(repoMock.save).toHaveBeenCalledTimes(1);
      expect(metricsService.recordClientDetailView).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza o cliente existente e informa quais campos mudaram', async () => {
      const client = mockClient();
      const dto = { name: 'Atualizado' };
      (repoMock.findOne as jest.Mock).mockResolvedValue(client);
      (repoMock.save as jest.Mock).mockResolvedValue({ ...client, ...dto });

      const result = await service.update(1, dto);

      expect(result.name).toBe('Atualizado');
      expect(logger.record).toHaveBeenCalledWith(
        'info',
        expect.objectContaining({ event: 'client.updated', changedFields: ['name'] }),
      );
    });
  });

  describe('remove', () => {
    it('faz soft delete e remove o cliente da base ativa', async () => {
      (repoMock.findOne as jest.Mock).mockResolvedValue(mockClient());
      (repoMock.softDelete as jest.Mock).mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(result.success).toBe(true);
      expect(result.clientId).toBe(1);
      expect(repoMock.softDelete).toHaveBeenCalledWith(1);
      expect(metricsService.recordClientMutation).toHaveBeenCalledWith('delete');
    });
  });

  it('propaga NotFoundException quando o cliente procurado não existe', async () => {
    (repoMock.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(99, { name: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
