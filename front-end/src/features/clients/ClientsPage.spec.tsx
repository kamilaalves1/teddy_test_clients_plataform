import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientsPage from './ClientsPage';
import { type Client } from '../../shared/api';

vi.mock('../../shared/AppLayout', () => ({
  default: ({ children }: { children: unknown }) => <div>{children}</div>,
}));

const baseClient: Client = {
  id: 1,
  name: 'Clínica Vértice',
  salary: 18500.5,
  companyValue: 980000,
  accessCount: 3,
  createdAt: '2026-04-01T15:30:00.000Z',
  updatedAt: '2026-04-01T15:30:00.000Z',
  deletedAt: null,
};

function renderPage(overrides: Partial<React.ComponentProps<typeof ClientsPage>> = {}) {
  return render(
    <ClientsPage
      userName="Kamila"
      clients={[baseClient]}
      onAddSelected={vi.fn()}
      onCreateClient={vi.fn()}
      onUpdateClient={vi.fn()}
      onDeleteClient={vi.fn()}
      onLogout={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ClientsPage', () => {
  it('barra o cadastro de cliente repetido e informa por toast', async () => {
    const onCreateClient = vi.fn();
    renderPage({ onCreateClient });

    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: '  clínica vértice  ' } });
    fireEvent.change(screen.getByLabelText('Salário'), { target: { value: '350000' } });
    fireEvent.change(screen.getByLabelText('Valor da empresa'), { target: { value: '12000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }));

    expect(onCreateClient).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Já existe um cliente cadastrado com esse nome.')).toBeTruthy();
      expect(screen.getByRole('status')).toHaveTextContent(
        'O cliente Clínica Vértice já está cadastrado.',
      );
    });
  });

  it('mostra toast de conflito quando o backend recusa a criação', async () => {
    const onCreateClient = vi
      .fn()
      .mockRejectedValue(new Error('Já existe um cliente cadastrado com o nome "Nova Clínica".'));
    renderPage({ clients: [], onCreateClient });

    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Clínica' } });
    fireEvent.change(screen.getByLabelText('Salário'), { target: { value: '350000' } });
    fireEvent.change(screen.getByLabelText('Valor da empresa'), { target: { value: '12000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar cliente' }));

    await waitFor(() => {
      expect(onCreateClient).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Já existe um cliente cadastrado com esse nome.')).toBeTruthy();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Não foi possível criar o cliente porque esse nome já existe.',
      );
    });
  });
});
