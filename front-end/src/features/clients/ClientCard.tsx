import { type Client } from '../../shared/api';
import { formatCurrency } from '../../shared/currency';

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M9.5 2L12 4.5L4.5 12H2V9.5L9.5 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M8 3.5L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M5 3.5V2.5A0.5 0.5 0 015.5 2h3a0.5 0.5 0 01.5.5V3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M3 3.5l.75 8h6.5L11 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ClientCard({
  client,
  showAdd,
  showRemove,
  onAdd,
  onRemove,
  onEdit,
  onDelete,
}: {
  client: Client;
  showAdd?: boolean;
  showRemove?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="client-card">
      <strong>{client.name}</strong>
      <p>Salário: {formatCurrency(client.salary)}</p>
      <p>Empresa: {formatCurrency(client.companyValue)}</p>

      <div className="card-actions">
        {showAdd ? (
          <button onClick={onAdd} aria-label="Selecionar cliente" title="Selecionar cliente">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M2 8H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}

        {onEdit ? (
          <button
            className="action-edit"
            onClick={onEdit}
            aria-label="Editar cliente"
            title="Editar cliente"
          >
            <IconEdit />
          </button>
        ) : null}

        {onDelete ? (
          <button
            className="action-delete"
            onClick={onDelete}
            aria-label="Excluir cliente"
            title="Excluir cliente"
          >
            <IconDelete />
          </button>
        ) : null}

        {showRemove ? (
          <button
            className="action-remove"
            onClick={onRemove}
            aria-label="Remover seleção"
            title="Remover seleção"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default ClientCard;
