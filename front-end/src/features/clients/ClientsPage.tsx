import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type Client } from '../../shared/api';
import { type ClientForm, initialClientForm } from './types';
import { maskCurrency, parseMoney } from '../../shared/currency';
import AppLayout from '../../shared/AppLayout';
import ClientCard from './ClientCard';

const clientsPerPageOptions = [8, 16, 24];

function normalizeClientName(name: string) {
  return name.trim().toLocaleLowerCase('pt-BR');
}

type FormErrors = Partial<Record<keyof ClientForm, string>>;

function validateForm(form: ClientForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) {
    errors.name = 'Nome é obrigatório.';
  }
  const salary = parseMoney(form.salary);
  if (!form.salary.trim()) {
    errors.salary = 'Salário é obrigatório.';
  } else if (isNaN(salary) || salary <= 0) {
    errors.salary = 'Informe um salário válido (ex: 3500,00).';
  }
  const company = parseMoney(form.companyValue);
  if (!form.companyValue.trim()) {
    errors.companyValue = 'Valor da empresa é obrigatório.';
  } else if (isNaN(company) || company <= 0) {
    errors.companyValue = 'Informe um valor válido (ex: 120000,00).';
  }
  return errors;
}

type ClientsPageProps = {
  userName: string;
  clients: Client[];
  onAddSelected: (clientId: number) => void;
  onCreateClient: (form: ClientForm) => Promise<void>;
  onUpdateClient: (clientId: number, form: ClientForm) => Promise<void>;
  onDeleteClient: (clientId: number) => Promise<void>;
  onLogout: () => void;
};

function ClientsPage({
  userName,
  clients,
  onAddSelected,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onLogout,
}: ClientsPageProps) {
  const [modal, setModal] = useState<'create' | 'edit' | 'edit-confirm' | 'delete' | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<ClientForm>(initialClientForm);
  const [editForm, setEditForm] = useState<ClientForm>(initialClientForm);
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [clientsPerPage, setClientsPerPage] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }, []);

  const deletingClient = useMemo(
    () => clients.find((c) => c.id === deletingClientId),
    [clients, deletingClientId],
  );

  const totalPages = Math.max(1, Math.ceil(clients.length / clientsPerPage));

  const visibleClients = useMemo(() => {
    const start = (currentPage - 1) * clientsPerPage;
    return clients.slice(start, start + clientsPerPage);
  }, [clients, currentPage, clientsPerPage]);

  const visiblePages = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const openEdit = (client: Client) => {
    setEditingClientId(client.id);
    setEditForm({
      name: client.name,
      salary: maskCurrency(String(Math.round(client.salary * 100))),
      companyValue: maskCurrency(String(Math.round(client.companyValue * 100))),
    });
    setEditErrors({});
    setApiError('');
    setModal('edit');
  };

  const openDelete = (client: Client) => {
    setDeletingClientId(client.id);
    setApiError('');
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setEditingClientId(null);
    setDeletingClientId(null);
    setCreateErrors({});
    setEditErrors({});
    setApiError('');
  };

  const handleCreate = async () => {
    const errors = validateForm(createForm);
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    const duplicatedClient = clients.find(
      (client) => normalizeClientName(client.name) === normalizeClientName(createForm.name),
    );

    if (duplicatedClient) {
      setCreateErrors((current) => ({
        ...current,
        name: 'Já existe um cliente cadastrado com esse nome.',
      }));
      setApiError('');
      showToast(`O cliente ${duplicatedClient.name} já está cadastrado.`);
      return;
    }

    try {
      setSubmitting(true);
      await onCreateClient(createForm);
      setCreateForm(initialClientForm);
      setCreateErrors({});
      closeModal();
      showToast('Cliente criado com sucesso!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('já existe um cliente cadastrado') || message.includes('conflict')) {
        setCreateErrors((current) => ({
          ...current,
          name: 'Já existe um cliente cadastrado com esse nome.',
        }));
        setApiError('');
        showToast('Não foi possível criar o cliente porque esse nome já existe.');
      } else {
        setApiError('Não foi possível criar o cliente. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (editingClientId === null) return;
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setApiError('');
    setModal('edit-confirm');
  };

  const handleEditConfirm = async () => {
    if (editingClientId === null) return;
    try {
      setSubmitting(true);
      await onUpdateClient(editingClientId, editForm);
      setEditErrors({});
      closeModal();
      showToast('Cliente atualizado com sucesso!');
    } catch {
      setApiError('Não foi possível editar o cliente. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClientId) return;
    try {
      setSubmitting(true);
      await onDeleteClient(deletingClientId);
      closeModal();
      showToast('Cliente excluído com sucesso!');
    } catch {
      setApiError('Não foi possível excluir o cliente. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout active="clients" userName={userName} onLogout={onLogout}>
      <main className="main-box">
        <div className="toolbar">
          <p className="toolbar-count">
            <strong>{clients.length}</strong> clientes encontrados:
          </p>
          <div className="per-page">
            <span>Clientes por página:</span>
            <select
              value={clientsPerPage}
              aria-label="Clientes por página"
              onChange={(e) => {
                setClientsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {clientsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="client-grid">
          {visibleClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              showAdd
              onAdd={() => {
                onAddSelected(client.id);
                showToast(`${client.name} foi selecionado com sucesso!`);
              }}
              onEdit={() => openEdit(client)}
              onDelete={() => openDelete(client)}
            />
          ))}
        </div>

        <button
          className="outline-main"
          onClick={() => {
            setCreateForm(initialClientForm);
            setCreateErrors({});
            setApiError('');
            setModal('create');
          }}
        >
          Criar cliente
        </button>

        {totalPages > 1 && (
          <div className="pagination" aria-label="Paginação">
            {visiblePages.map((page, idx) =>
              page === '...' ? (
                <span key={`el-${idx}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        )}
      </main>

      {modal ? <div className="overlay" onClick={closeModal} /> : null}

      {modal === 'create' && (
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-create-title"
        >
          <div className="modal-title-row">
            <h3 id="modal-create-title">Criar cliente:</h3>
            <button className="close" onClick={closeModal} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="field-group">
            <input
              placeholder="Digite o nome:"
              value={createForm.name}
              aria-label="Nome"
              aria-invalid={!!createErrors.name}
              onChange={(e) => {
                setCreateForm((f) => ({ ...f, name: e.target.value }));
                setCreateErrors((er) => ({ ...er, name: undefined }));
              }}
            />
            {createErrors.name && <span className="field-error">{createErrors.name}</span>}
          </div>

          <div className="field-group">
            <input
              placeholder="Digite o salário:"
              value={createForm.salary}
              aria-label="Salário"
              aria-invalid={!!createErrors.salary}
              inputMode="numeric"
              onChange={(e) => {
                setCreateForm((f) => ({ ...f, salary: maskCurrency(e.target.value) }));
                setCreateErrors((er) => ({ ...er, salary: undefined }));
              }}
            />
            {createErrors.salary && <span className="field-error">{createErrors.salary}</span>}
          </div>

          <div className="field-group">
            <input
              placeholder="Digite o valor da empresa:"
              value={createForm.companyValue}
              aria-label="Valor da empresa"
              aria-invalid={!!createErrors.companyValue}
              inputMode="numeric"
              onChange={(e) => {
                setCreateForm((f) => ({ ...f, companyValue: maskCurrency(e.target.value) }));
                setCreateErrors((er) => ({ ...er, companyValue: undefined }));
              }}
            />
            {createErrors.companyValue && (
              <span className="field-error">{createErrors.companyValue}</span>
            )}
          </div>

          <button className="solid-main" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Criando...' : 'Criar cliente'}
          </button>
          {apiError && <p className="field-error">{apiError}</p>}
        </section>
      )}

      {modal === 'edit' && (
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-title"
        >
          <div className="modal-title-row">
            <h3 id="modal-edit-title">Editar cliente:</h3>
            <button className="close" onClick={closeModal} aria-label="Fechar">
              ×
            </button>
          </div>

          <div className="field-group">
            <input
              value={editForm.name}
              aria-label="Nome"
              aria-invalid={!!editErrors.name}
              onChange={(e) => {
                setEditForm((f) => ({ ...f, name: e.target.value }));
                setEditErrors((er) => ({ ...er, name: undefined }));
              }}
            />
            {editErrors.name && <span className="field-error">{editErrors.name}</span>}
          </div>

          <div className="field-group">
            <input
              value={editForm.salary}
              aria-label="Salário"
              aria-invalid={!!editErrors.salary}
              inputMode="numeric"
              onChange={(e) => {
                setEditForm((f) => ({ ...f, salary: maskCurrency(e.target.value) }));
                setEditErrors((er) => ({ ...er, salary: undefined }));
              }}
            />
            {editErrors.salary && <span className="field-error">{editErrors.salary}</span>}
          </div>

          <div className="field-group">
            <input
              value={editForm.companyValue}
              aria-label="Valor da empresa"
              aria-invalid={!!editErrors.companyValue}
              inputMode="numeric"
              onChange={(e) => {
                setEditForm((f) => ({ ...f, companyValue: maskCurrency(e.target.value) }));
                setEditErrors((er) => ({ ...er, companyValue: undefined }));
              }}
            />
            {editErrors.companyValue && (
              <span className="field-error">{editErrors.companyValue}</span>
            )}
          </div>

          <button className="solid-main" disabled={submitting} onClick={handleEdit}>
            {submitting ? 'Salvando...' : 'Editar cliente'}
          </button>
          {apiError && <p className="field-error">{apiError}</p>}
        </section>
      )}

      {modal === 'edit-confirm' && (
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-confirm-title"
        >
          <div className="modal-title-row">
            <h3 id="modal-edit-confirm-title">Editar cliente:</h3>
            <button className="close" onClick={closeModal} aria-label="Fechar">
              ×
            </button>
          </div>
          <p>
            Tem certeza que deseja editar o cliente <strong>{editForm.name}</strong>?
          </p>
          <div className="confirm-actions">
            <button className="outline-main" onClick={() => setModal('edit')}>
              Voltar
            </button>
            <button className="solid-main" disabled={submitting} onClick={handleEditConfirm}>
              {submitting ? 'Salvando...' : 'Confirmar edição'}
            </button>
          </div>
          {apiError && <p className="field-error">{apiError}</p>}
        </section>
      )}

      {modal === 'delete' && (
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
        >
          <div className="modal-title-row">
            <h3 id="modal-delete-title">Excluir cliente:</h3>
            <button className="close" onClick={closeModal} aria-label="Fechar">
              ×
            </button>
          </div>
          <p>
            Você está prestes a excluir o cliente: <strong>{deletingClient?.name ?? ''}</strong>
          </p>
          <button className="solid-main" disabled={submitting} onClick={handleDelete}>
            {submitting ? 'Excluindo...' : 'Excluir cliente'}
          </button>
          {apiError && <p className="field-error">{apiError}</p>}
        </section>
      )}

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </AppLayout>
  );
}

export default ClientsPage;
