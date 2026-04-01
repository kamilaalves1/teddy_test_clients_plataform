import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useClientsState } from './useClientsState';
import * as api from '../../shared/api';

vi.mock('../../shared/api');

const mockClients: api.Client[] = [
  {
    id: 1,
    name: 'Alice',
    salary: 3000,
    companyValue: 50000,
    accessCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
  },
  {
    id: 2,
    name: 'Bob',
    salary: 4500,
    companyValue: 80000,
    accessCount: 2,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    deletedAt: null,
  },
];

const paginatedMockClients = (): api.PaginatedClients => ({
  data: mockClients,
  total: 2,
  page: 1,
  limit: 16,
});

describe('useClientsState', () => {
  const onUnauthorized = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca clientes ao montar e limpa o estado quando a sessão some', async () => {
    vi.mocked(api.getClients).mockResolvedValue(paginatedMockClients());
    const { result, rerender } = renderHook(
      ({ token }) => useClientsState({ token, onUnauthorized }),
      { initialProps: { token: 'tok' } },
    );

    await waitFor(() => expect(result.current.clients).toHaveLength(2));
    expect(api.getClients).toHaveBeenCalledWith('tok', 1, 16);

    act(() => result.current.addSelectedClient(1));
    rerender({ token: '' });

    await waitFor(() => expect(result.current.clients).toHaveLength(0));
    expect(result.current.selectedClientIds).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('avisa quando a carga inicial falha por sessão inválida', async () => {
    vi.mocked(api.getClients).mockRejectedValue(new Error('Unauthorized'));

    renderHook(() => useClientsState({ token: 'bad', onUnauthorized }));

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it('refaz a listagem depois de criar um cliente', async () => {
    const newClient: api.Client = {
      id: 3,
      name: 'Carol',
      salary: 5000,
      companyValue: 90000,
      accessCount: 0,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
      deletedAt: null,
    };

    vi.mocked(api.getClients)
      .mockResolvedValueOnce(paginatedMockClients())
      .mockResolvedValueOnce({ data: [newClient, ...mockClients], total: 3, page: 1, limit: 16 });

    vi.mocked(api.createClient).mockResolvedValue(newClient);

    const { result } = renderHook(() => useClientsState({ token: 'tok', onUnauthorized }));
    await waitFor(() => expect(result.current.clients).toHaveLength(2));

    await act(async () => {
      await result.current.handleCreateClient({
        name: 'Carol',
        salary: '5.000,00',
        companyValue: '90.000,00',
      });
    });

    await waitFor(() => expect(result.current.clients).toHaveLength(3));
    expect(result.current.clients[0]).toEqual(newClient);
    expect(api.getClients).toHaveBeenCalledTimes(2);
  });

  it('atualiza a lista local quando edita e remove um cliente já selecionado', async () => {
    vi.mocked(api.getClients).mockResolvedValue(paginatedMockClients());
    const updated = { ...mockClients[0], name: 'Alice Updated' };
    vi.mocked(api.updateClient).mockResolvedValue(updated);
    vi.mocked(api.deleteClient).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useClientsState({ token: 'tok', onUnauthorized }));
    await waitFor(() => expect(result.current.clients).toHaveLength(2));

    await act(async () => {
      await result.current.handleUpdateClient(1, {
        name: 'Alice Updated',
        salary: '3.000,00',
        companyValue: '50.000,00',
      });
    });

    expect(result.current.clients.find((c) => c.id === 1)?.name).toBe('Alice Updated');

    act(() => result.current.addSelectedClient(1));

    await act(async () => {
      await result.current.handleDeleteClient(1);
    });

    expect(result.current.clients.find((c) => c.id === 1)).toBeUndefined();
    expect(result.current.selectedClientIds).not.toContain(1);
  });

  it('mantém a seleção sem duplicar ids e permite limpar tudo', () => {
    const { result } = renderHook(() => useClientsState({ token: '', onUnauthorized }));

    act(() => {
      result.current.addSelectedClient(5);
      result.current.addSelectedClient(5);
      result.current.addSelectedClient(7);
      result.current.removeSelectedClient(7);
    });

    expect(result.current.selectedClientIds).toEqual([5]);

    act(() => {
      result.current.clearSelectedClients();
    });

    expect(result.current.selectedClientIds).toHaveLength(0);
  });
});
