import { type Client } from '../../shared/api';
import AppLayout from '../../shared/AppLayout';
import ClientCard from './ClientCard';

type SelectedClientsPageProps = {
  userName: string;
  clients: Client[];
  selectedClientIds: number[];
  onRemoveSelected: (clientId: number) => void;
  onClearSelected: () => void;
  onLogout: () => void;
};

function SelectedClientsPage({
  userName,
  clients,
  selectedClientIds,
  onRemoveSelected,
  onClearSelected,
  onLogout,
}: SelectedClientsPageProps) {
  const selectedClients = clients.filter((c) => selectedClientIds.includes(c.id));

  return (
    <AppLayout active="selected" userName={userName} onLogout={onLogout}>
      <main className="main-box">
        <h2>Clientes selecionados:</h2>

        <div className="client-grid">
          {selectedClients.length === 0 && (
            <p style={{ color: '#888', fontSize: 13 }}>Nenhum cliente selecionado.</p>
          )}
          {selectedClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              showRemove
              onRemove={() => onRemoveSelected(client.id)}
            />
          ))}
        </div>

        <button className="outline-main" onClick={onClearSelected}>
          Limpar clientes selecionados
        </button>
      </main>
    </AppLayout>
  );
}

export default SelectedClientsPage;
