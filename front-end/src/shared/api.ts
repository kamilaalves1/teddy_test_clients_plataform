export type Client = {
  id: number;
  name: string;
  salary: number;
  companyValue: number;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PaginatedClients = {
  data: Client[];
  total: number;
  page: number;
  limit: number;
};

type ClientPayload = {
  name: string;
  salary: number;
  companyValue: number;
};

type AuthResponse = {
  access_token: string;
  name: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}/v1${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(name: string, email: string, password: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function getClients(token: string, page = 1, limit = 16) {
  return request<PaginatedClients>(`/clients?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createClient(token: string, body: ClientPayload) {
  return request<Client>('/clients', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function updateClient(token: string, id: number, body: ClientPayload) {
  return request<Client>(`/clients/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

export function deleteClient(token: string, id: number) {
  return request<{ success: boolean }>(`/clients/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
