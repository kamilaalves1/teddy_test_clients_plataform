import { NotFoundException } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientEntity } from './client.entity';
import { PaginationDto } from './dto/pagination.dto';

const makeClient = (id: number): ClientEntity =>
  Object.assign(new ClientEntity(), {
    id,
    name: `Client ${id}`,
    salary: 3000,
    companyValue: 60000,
    accessCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
} as unknown as ClientsService;

const ctrl = new ClientsController(mockService);

const pagination = (page = 1, limit = 16): PaginationDto =>
  Object.assign(new PaginationDto(), { page, limit });

describe('ClientsController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('delega para service.create e retorna resultado', async () => {
      const dto = { name: 'Novo', salary: 2000, companyValue: 30000 };
      jest.spyOn(mockService, 'create').mockResolvedValue(makeClient(1));
      const result = await ctrl.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe(1);
    });
  });

  describe('findAll', () => {
    it('retorna resultado paginado', async () => {
      const paginated = { data: [makeClient(1), makeClient(2)], total: 2, page: 1, limit: 16 };
      jest.spyOn(mockService, 'findAll').mockResolvedValue(paginated);
      const result = await ctrl.findAll(pagination());
      expect(mockService.findAll).toHaveBeenCalledWith(1, 16);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('repassa page e limit corretos ao service', async () => {
      const paginated = { data: [], total: 0, page: 2, limit: 10 };
      jest.spyOn(mockService, 'findAll').mockResolvedValue(paginated);
      await ctrl.findAll(pagination(2, 10));
      expect(mockService.findAll).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('findOne', () => {
    it('retorna cliente pelo id', async () => {
      jest.spyOn(mockService, 'findOne').mockResolvedValue(makeClient(5));
      const result = await ctrl.findOne(5);
      expect(mockService.findOne).toHaveBeenCalledWith(5);
      expect(result.id).toBe(5);
    });

    it('propaga NotFoundException do service', async () => {
      jest.spyOn(mockService, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(ctrl.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('delega para service.update com id e dto', async () => {
      const dto = { name: 'Atualizado', salary: 4000, companyValue: 70000 };
      const updated = makeClient(2);
      updated.name = 'Atualizado';
      jest.spyOn(mockService, 'update').mockResolvedValue(updated);

      const result = await ctrl.update(2, dto);
      expect(mockService.update).toHaveBeenCalledWith(2, dto);
      expect(result.name).toBe('Atualizado');
    });

    it('propaga NotFoundException quando cliente não encontrado', async () => {
      jest.spyOn(mockService, 'update').mockRejectedValue(new NotFoundException());
      await expect(ctrl.update(99, {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('delega para service.remove e retorna resposta de sucesso', async () => {
      const res = { success: true, clientId: 3, message: 'Cliente removido com sucesso' };
      jest.spyOn(mockService, 'remove').mockResolvedValue(res);
      const result = await ctrl.remove(3);
      expect(mockService.remove).toHaveBeenCalledWith(3);
      expect(result.success).toBe(true);
    });

    it('propaga NotFoundException quando cliente não encontrado', async () => {
      jest.spyOn(mockService, 'remove').mockRejectedValue(new NotFoundException());
      await expect(ctrl.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
