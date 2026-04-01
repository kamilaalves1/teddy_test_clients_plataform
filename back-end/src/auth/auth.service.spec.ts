import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppLogger } from '../common/app-logger.service';
import { RequestContextService } from '../common/request-context.service';
import { MetricsService } from '../metrics/metrics.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';

const makeMockRepo = (user: User | null) => ({
  findOne: jest.fn().mockResolvedValue(user),
  create: jest.fn().mockImplementation((data: Partial<User>) => ({ id: 1, ...data })),
  save: jest.fn().mockImplementation((u: User) => Promise.resolve(u)),
});

const jwtService = {
  sign: jest.fn().mockReturnValue('mocked-token'),
} as unknown as JwtService;

const metricsService = {
  recordLoginSuccess: jest.fn(),
  recordLoginFailure: jest.fn(),
  recordRegisterSuccess: jest.fn(),
  recordRegisterFailure: jest.fn(),
} as unknown as MetricsService;

const logger = {
  record: jest.fn(),
} as unknown as AppLogger;

const requestContext = {
  patch: jest.fn(),
} as unknown as RequestContextService;

function createService(user: User | null) {
  const repo = makeMockRepo(user);
  const service = new AuthService(
    jwtService,
    repo as never,
    metricsService,
    logger,
    requestContext,
  );
  return { service, repo };
}

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('gera token e registra o login quando as credenciais conferem', async () => {
      const hash = await bcrypt.hash('senha123', 10);
      const user = { id: 1, name: 'João', email: 'joao@teddy.com', passwordHash: hash } as User;
      const { service } = createService(user);

      const result = await service.login({ email: 'joao@teddy.com', password: 'senha123' });

      expect(result).toEqual({ access_token: 'mocked-token', name: 'João' });
      expect(requestContext.patch).toHaveBeenCalledWith({ userId: 1, userEmail: 'joao@teddy.com' });
      expect(metricsService.recordLoginSuccess).toHaveBeenCalled();
      expect(logger.record).toHaveBeenCalledWith(
        'info',
        expect.objectContaining({ event: 'auth.logged_in', userId: 1 }),
      );
    });

    it('recusa login de usuário inexistente e nem tenta assinar JWT', async () => {
      const { service } = createService(null);

      await expect(service.login({ email: 'x@x.com', password: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(metricsService.recordLoginFailure).toHaveBeenCalled();
      expect(logger.record).toHaveBeenCalledWith(
        'warn',
        expect.objectContaining({ event: 'auth.login.failed', email: 'x@x.com' }),
      );
    });

    it('trata senha inválida como falha de autenticação', async () => {
      const hash = await bcrypt.hash('correta', 10);
      const user = { id: 1, name: 'Ana', email: 'ana@teddy.com', passwordHash: hash } as User;
      const { service } = createService(user);

      await expect(service.login({ email: 'ana@teddy.com', password: 'errada' })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(metricsService.recordLoginFailure).toHaveBeenCalled();
      expect(logger.record).toHaveBeenCalledWith(
        'warn',
        expect.objectContaining({ event: 'auth.login.failed', userId: 1 }),
      );
    });
  });

  describe('register', () => {
    it('normaliza o e-mail antes de salvar e devolve o nome do novo usuário', async () => {
      const { service, repo } = createService(null);

      const result = await service.register({
        name: 'Maria',
        email: '  MARIA@TEDDY.COM  ',
        password: 'senha123',
      });

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'maria@teddy.com', name: 'Maria' }),
      );
      expect(result.name).toBe('Maria');
      expect(result.access_token).toBe('mocked-token');
      expect(metricsService.recordRegisterSuccess).toHaveBeenCalled();
    });

    it('barra e-mail duplicado e deixa rastros úteis para investigação', async () => {
      const existingUser = { id: 2, email: 'dupe@teddy.com' } as User;
      const { service, repo } = createService(existingUser);

      await expect(
        service.register({ name: 'Dup', email: 'dupe@teddy.com', password: 'senha123' }),
      ).rejects.toThrow(ConflictException);

      expect(repo.save).not.toHaveBeenCalled();
      expect(metricsService.recordRegisterFailure).toHaveBeenCalled();
      expect(logger.record).toHaveBeenCalledWith(
        'warn',
        expect.objectContaining({ event: 'auth.register', reason: 'duplicate_email' }),
      );
    });
  });
});
