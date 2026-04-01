import { useCallback } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { useClientsState } from '../features/clients/useClientsState';
import { useSession } from '../features/auth/useSession';
import ClientsPage from '../features/clients/ClientsPage';
import HomePage from '../features/dashboard/HomePage';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import SelectedClientsPage from '../features/clients/SelectedClientsPage';

export function App() {
  const navigate = useNavigate();

  const {
    token,
    userName,
    loadingLogin,
    loginError,
    handleLogin,
    handleRegister,
    handleLogout,
    clearToken,
  } = useSession();

  const handleUnauthorized = useCallback(() => {
    clearToken();
  }, [clearToken]);

  const {
    clients,
    selectedClientIds,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    addSelectedClient,
    removeSelectedClient,
    clearSelectedClients,
  } = useClientsState({ token, onUnauthorized: handleUnauthorized });

  const logoutAndResetSelection = () => {
    clearSelectedClients();
    handleLogout();
  };

  const onRegister = async (name: string, email: string, password: string) => {
    await handleRegister(name, email, password);
    navigate('/home', { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/home" replace />
          ) : (
            <LoginPage
              onLogin={handleLogin}
              onGoToRegister={() => navigate('/register')}
              loading={loadingLogin}
              error={loginError}
            />
          )
        }
      />
      <Route
        path="/register"
        element={
          token ? (
            <Navigate to="/home" replace />
          ) : (
            <RegisterPage onRegister={onRegister} onGoToLogin={() => navigate('/')} />
          )
        }
      />
      <Route
        path="/home"
        element={
          token ? (
            <HomePage userName={userName} clients={clients} onLogout={logoutAndResetSelection} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/clients"
        element={
          token ? (
            <ClientsPage
              userName={userName}
              clients={clients}
              onAddSelected={addSelectedClient}
              onCreateClient={handleCreateClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onLogout={logoutAndResetSelection}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/selected-clients"
        element={
          token ? (
            <SelectedClientsPage
              userName={userName}
              clients={clients}
              selectedClientIds={selectedClientIds}
              onRemoveSelected={removeSelectedClient}
              onClearSelected={clearSelectedClients}
              onLogout={logoutAndResetSelection}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
