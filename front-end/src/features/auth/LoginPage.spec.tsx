import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

const mockLogin = vi.fn();
const mockGoToRegister = vi.fn();

function renderPage(overrides: Partial<Parameters<typeof LoginPage>[0]> = {}) {
  return render(
    <LoginPage
      onLogin={mockLogin}
      onGoToRegister={mockGoToRegister}
      loading={false}
      error=""
      {...overrides}
    />,
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra a estrutura básica da tela e permite ir para cadastro', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    const passwordField = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(passwordField).toBeTruthy();
    expect(passwordField.maxLength).toBe(10);
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(mockGoToRegister).toHaveBeenCalledTimes(1);
  });

  it('envia credenciais aparadas quando o formulário passa na validação', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderPage();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: '  user@test.com  ' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'senha123'));
  });

  it('segura o submit quando o usuário tenta entrar com e-mail malformado', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@test.com' } });
    await waitFor(() => expect(screen.queryByText('Informe um e-mail válido.')).toBeNull());
  });

  it('reflete loading e erro vindos de fora', () => {
    renderPage({ error: 'E-mail ou senha inválidos. Tente novamente.', loading: true });
    const btn = screen.getByRole('button', { name: 'Entrando...' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText('E-mail ou senha inválidos. Tente novamente.')).toBeTruthy();
  });
});
