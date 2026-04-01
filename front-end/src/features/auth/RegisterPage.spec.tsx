import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import RegisterPage from './RegisterPage';

const mockRegister = vi.fn();
const mockGoToLogin = vi.fn();

function renderPage(overrides: Partial<Parameters<typeof RegisterPage>[0]> = {}) {
  return render(
    <RegisterPage onRegister={mockRegister} onGoToLogin={mockGoToLogin} {...overrides} />,
  );
}

function fillForm(
  name = 'João Silva',
  email = 'joao@test.com',
  password = 'senha123',
  confirm = 'senha123',
) {
  if (name) fireEvent.change(screen.getByLabelText('Nome'), { target: { value: name } });
  if (email) fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: email } });
  if (password) fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } });
  if (confirm)
    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: confirm } });
}

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('abre a tela de cadastro com os campos esperados e permite voltar para login', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeTruthy();
    expect(screen.getByLabelText('Nome')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar senha')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Já tenho conta' }));
    expect(mockGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('envia os dados já normalizados quando o cadastro é válido', async () => {
    mockRegister.mockResolvedValue(undefined);
    renderPage();
    fillForm('  João Silva  ', 'joao@test.com', 'senha123', 'senha123');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('João Silva', 'joao@test.com', 'senha123'),
    );
  });

  it('mostra erro de confirmação de senha e limpa o alerta quando o usuário corrige', async () => {
    renderPage();
    fillForm('João', 'joao@test.com', 'senha123', 'outrosenha');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(screen.getByText('As senhas não coincidem.')).toBeTruthy());
    expect(mockRegister).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha123' } });
    await waitFor(() => expect(screen.queryByText('As senhas não coincidem.')).toBeNull());
  });

  it('traduz conflito de e-mail duplicado para uma mensagem útil', async () => {
    mockRegister.mockRejectedValue(new Error('409 Conflict'));
    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(screen.getByText('Este e-mail já está cadastrado. Tente fazer login.')).toBeTruthy(),
    );
  });

  it('cai na mensagem genérica quando o backend falha fora do caso conhecido', async () => {
    mockRegister.mockRejectedValue(new Error('Network error'));
    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(screen.getByText('Não foi possível criar a conta. Tente novamente.')).toBeTruthy(),
    );
  });
});
