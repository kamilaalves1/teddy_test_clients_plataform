import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import App from './app';

// Mock the API module
vi.mock('../shared/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getClients: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 16 }),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
}));

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('unauthenticated routes', () => {
    it('renders login page on "/" by default', () => {
      renderApp('/');
      expect(screen.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeTruthy();
    });

    it('shows email input on login page', () => {
      renderApp('/');
      expect(screen.getByPlaceholderText('Digite seu e-mail:')).toBeTruthy();
    });

    it('shows password input on login page', () => {
      renderApp('/');
      expect(screen.getByPlaceholderText('Digite sua senha:')).toBeTruthy();
    });

    it('shows Entrar button on login page', () => {
      renderApp('/');
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    });

    it('shows Criar conta button on login page', () => {
      renderApp('/');
      expect(screen.getByRole('button', { name: 'Criar conta' })).toBeTruthy();
    });

    it('redirects "/" to "/" (stays on login) when not authenticated', () => {
      renderApp('/home');
      expect(screen.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeTruthy();
    });

    it('redirects protected /clients to login when not authenticated', () => {
      renderApp('/clients');
      expect(screen.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeTruthy();
    });

    it('redirects unknown route to login', () => {
      renderApp('/unknown-path');
      expect(screen.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeTruthy();
    });
  });

  describe('login form validation', () => {
    it('shows email error when submitting empty form', async () => {
      renderApp('/');
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
      await waitFor(() => {
        expect(screen.getByText('Informe seu e-mail.')).toBeTruthy();
      });
    });

    it('shows invalid email error for bad format', async () => {
      renderApp('/');
      fireEvent.change(screen.getByPlaceholderText('Digite seu e-mail:'), {
        target: { value: 'not-an-email' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
      await waitFor(() => {
        expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
      });
    });

    it('shows password error when email valid but password empty', async () => {
      renderApp('/');
      fireEvent.change(screen.getByPlaceholderText('Digite seu e-mail:'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
      await waitFor(() => {
        expect(screen.getByText('Informe sua senha.')).toBeTruthy();
      });
    });

    it('calls onLogin with email and password when form is valid', async () => {
      const api = await import('../shared/api');
      (api.login as ReturnType<typeof vi.fn>).mockResolvedValue({
        access_token: 'tok',
        name: 'Test',
      });
      (api.getClients as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 16,
      });

      renderApp('/');
      fireEvent.change(screen.getByPlaceholderText('Digite seu e-mail:'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Digite sua senha:'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });
  });

  describe('register page navigation', () => {
    it('navigates to /register when Criar conta is clicked', async () => {
      renderApp('/');
      fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /criar conta/i })).toBeTruthy();
      });
    });

    it('shows register form fields', async () => {
      renderApp('/register');
      expect(screen.getByPlaceholderText('Digite seu nome:')).toBeTruthy();
      expect(screen.getByPlaceholderText('Digite seu e-mail:')).toBeTruthy();
    });
  });

  describe('authenticated state', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'valid-jwt-token');
      localStorage.setItem('userName', 'Kamila');
    });

    it('redirects "/" to "/home" when authenticated', async () => {
      renderApp('/');
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeNull();
      });
    });
  });
});
