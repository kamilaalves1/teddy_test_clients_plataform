import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ClientCard from './ClientCard';
import { type Client } from '../../shared/api';

const baseClient: Client = {
  id: 1,
  name: 'Eduardo Oliveira',
  salary: 3500,
  companyValue: 120000,
  accessCount: 5,
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  deletedAt: null,
};

describe('ClientCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mostra os dados principais do cliente já formatados', () => {
    render(<ClientCard client={baseClient} />);

    expect(screen.getByText('Eduardo Oliveira')).toBeTruthy();
    expect(screen.getByText(/Salário/i).textContent).toContain('3.500');
    const companyEl = screen.getByText(/Empresa/i);
    expect(companyEl.textContent).toContain('120.000');
  });

  it('liga as ações opcionais quando elas são expostas pelo card', () => {
    const onAdd = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onRemove = vi.fn();

    render(
      <ClientCard
        client={baseClient}
        showAdd
        showRemove
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByLabelText('Selecionar cliente'));
    fireEvent.click(screen.getByLabelText('Editar cliente'));
    fireEvent.click(screen.getByLabelText('Excluir cliente'));
    fireEvent.click(screen.getByLabelText('Remover seleção'));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('não inventa botões quando o card foi renderizado só para leitura', () => {
    render(<ClientCard client={baseClient} />);

    expect(screen.queryByLabelText('Selecionar cliente')).toBeNull();
    expect(screen.queryByLabelText('Editar cliente')).toBeNull();
    expect(screen.queryByLabelText('Excluir cliente')).toBeNull();
    expect(screen.queryByLabelText('Remover seleção')).toBeNull();
  });

  it('lida com salário zerado sem quebrar a formatação', () => {
    const client = { ...baseClient, salary: 0 };

    render(<ClientCard client={client} />);

    expect(screen.getByText(/Salário/i).textContent).toContain('0');
  });
});
