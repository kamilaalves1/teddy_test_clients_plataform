import { useEffect, useState } from 'react';

import {
  type Client,
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from '../../shared/api';
import { parseMoney } from '../../shared/currency';
import { type ClientForm } from './types';

type UseClientsStateParams = {
  token: string;
  onUnauthorized: () => void;
};

export function useClientsState({ token, onUnauthorized }: UseClientsStateParams) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(16);
  const [total, setTotal] = useState(0);

  const fetchClients = (currentPage = page, currentLimit = limit) => {
    if (!token) return;
    getClients(token, currentPage, currentLimit)
      .then(({ data, total: t }) => {
        setClients(data);
        setTotal(t);
      })
      .catch(onUnauthorized);
  };

  useEffect(() => {
    if (!token) {
      setClients([]);
      setSelectedClientIds([]);
      setTotal(0);
      return;
    }

    fetchClients();
  }, [token, page, limit]);

  const handleCreateClient = async (form: ClientForm) => {
    await createClient(token, {
      name: form.name,
      salary: parseMoney(form.salary),
      companyValue: parseMoney(form.companyValue),
    });

    fetchClients();
  };

  const handleUpdateClient = async (clientId: number, form: ClientForm) => {
    const updated = await updateClient(token, clientId, {
      name: form.name,
      salary: parseMoney(form.salary),
      companyValue: parseMoney(form.companyValue),
    });

    setClients((current) => current.map((c) => (c.id === clientId ? updated : c)));
  };

  const handleDeleteClient = async (clientId: number) => {
    await deleteClient(token, clientId);
    setClients((current) => current.filter((c) => c.id !== clientId));
    setSelectedClientIds((current) => current.filter((id) => id !== clientId));
    setTotal((t) => t - 1);
  };

  const addSelectedClient = (clientId: number) => {
    setSelectedClientIds((current) =>
      current.includes(clientId) ? current : [...current, clientId],
    );
  };

  const removeSelectedClient = (clientId: number) => {
    setSelectedClientIds((current) => current.filter((id) => id !== clientId));
  };

  const clearSelectedClients = () => {
    setSelectedClientIds([]);
  };

  return {
    clients,
    selectedClientIds,
    total,
    page,
    limit,
    setPage,
    setLimit,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    addSelectedClient,
    removeSelectedClient,
    clearSelectedClients,
  };
}
