import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockService = {
  register: jest.fn(),
  login: jest.fn(),
} as unknown as AuthService;

const ctrl = new AuthController(mockService);

describe('AuthController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('encaminha cadastro e login para o serviço, mantendo o payload intacto', async () => {
    jest.spyOn(mockService, 'register').mockResolvedValue({
      access_token: 'tok',
      name: 'João',
    });
    jest.spyOn(mockService, 'login').mockResolvedValue({
      access_token: 'jwt',
      name: 'Maria',
    });

    const registerDto = { name: 'João', email: 'joao@test.com', password: 'senha123' };
    const loginDto = { email: 'maria@test.com', password: 'pw' };

    const registerResult = await ctrl.register(registerDto);
    const loginResult = await ctrl.login(loginDto);

    expect(mockService.register).toHaveBeenCalledWith(registerDto);
    expect(mockService.login).toHaveBeenCalledWith(loginDto);
    expect(registerResult).toEqual({ access_token: 'tok', name: 'João' });
    expect(loginResult).toEqual({ access_token: 'jwt', name: 'Maria' });
  });

  it('não esconde os erros vindos do serviço', async () => {
    jest
      .spyOn(mockService, 'register')
      .mockRejectedValue(new ConflictException('E-mail já cadastrado'));
    jest
      .spyOn(mockService, 'login')
      .mockRejectedValue(new UnauthorizedException('E-mail ou senha inválidos.'));

    await expect(
      ctrl.register({ name: 'X', email: 'dup@test.com', password: 'senha123' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(ctrl.login({ email: 'x@x.com', password: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
