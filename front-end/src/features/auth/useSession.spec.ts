import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useSession } from './useSession';
import * as api from '../../shared/api';

vi.mock('../../shared/api');

describe('useSession', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with empty token when localStorage is empty', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.token).toBe('');
  });

  it('initializes token from localStorage', () => {
    localStorage.setItem('token', 'saved-token');
    localStorage.setItem('userName', 'Kamila');
    const { result } = renderHook(() => useSession());
    expect(result.current.token).toBe('saved-token');
    expect(result.current.userName).toBe('Kamila');
  });

  it('initializes with empty userName when not in localStorage', () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.userName).toBe('');
  });

  it('handleLogin stores token and userName on success', async () => {
    vi.mocked(api.login).mockResolvedValue({ access_token: 'jwt-123', name: 'João' });
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleLogin('joao@test.com', 'senha123');
    });

    expect(result.current.token).toBe('jwt-123');
    expect(result.current.userName).toBe('João');
    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(localStorage.getItem('userName')).toBe('João');
  });

  it('handleLogin sets loginError on failure', async () => {
    vi.mocked(api.login).mockRejectedValue(new Error('Unauthorized'));
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleLogin('x@x.com', 'wrong');
    });

    expect(result.current.loginError).toBeTruthy();
    expect(result.current.token).toBe('');
  });

  it('handleLogin clears previous loginError before request', async () => {
    vi.mocked(api.login)
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValueOnce({ access_token: 't', name: 'U' });
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleLogin('x@x.com', 'wrong');
    });
    expect(result.current.loginError).toBeTruthy();

    await act(async () => {
      await result.current.handleLogin('x@x.com', 'right');
    });
    expect(result.current.loginError).toBe('');
  });

  it('handleLogout clears token, userName and localStorage', async () => {
    vi.mocked(api.login).mockResolvedValue({ access_token: 'tok', name: 'Ana' });
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleLogin('a@a.com', 'pw');
    });
    expect(result.current.token).toBe('tok');

    act(() => result.current.handleLogout());

    expect(result.current.token).toBe('');
    expect(result.current.userName).toBe('');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userName')).toBeNull();
  });

  it('clearToken removes only token from localStorage', async () => {
    vi.mocked(api.login).mockResolvedValue({ access_token: 'tok', name: 'Ana' });
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleLogin('a@a.com', 'pw');
    });

    act(() => result.current.clearToken());

    expect(result.current.token).toBe('');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userName')).toBe('Ana');
  });

  it('handleRegister stores token and userName on success', async () => {
    vi.mocked(api.register).mockResolvedValue({ access_token: 'new-jwt', name: 'Maria' });
    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.handleRegister('Maria', 'maria@test.com', 'senha123');
    });

    expect(result.current.token).toBe('new-jwt');
    expect(result.current.userName).toBe('Maria');
    expect(localStorage.getItem('token')).toBe('new-jwt');
  });

  it('loading state is true during login request', async () => {
    let resolve!: (v: { access_token: string; name: string }) => void;
    vi.mocked(api.login).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { result } = renderHook(() => useSession());

    act(() => {
      void result.current.handleLogin('a@a.com', 'pw');
    });
    expect(result.current.loadingLogin).toBe(true);

    await act(async () => {
      resolve({ access_token: 't', name: 'U' });
    });
    await waitFor(() => expect(result.current.loadingLogin).toBe(false));
  });
});
