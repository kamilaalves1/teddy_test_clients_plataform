import { useCallback, useState } from 'react';
import { login, register } from '../../shared/api';

export function useSession() {
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? '');
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') ?? '');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const persistSession = (access_token: string, name: string) => {
    localStorage.setItem('token', access_token);
    localStorage.setItem('userName', name);
    setToken(access_token);
    setUserName(name);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoadingLogin(true);
      setLoginError('');
      const { access_token, name } = await login(email, password);
      persistSession(access_token, name);
    } catch {
      setLoginError('E-mail ou senha inválidos. Tente novamente.');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const { access_token, name: returnedName } = await register(name, email, password);
    persistSession(access_token, returnedName);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setToken('');
    setUserName('');
  };

  const clearToken = useCallback(() => {
    localStorage.removeItem('token');
    setToken('');
  }, []);

  return {
    token,
    userName,
    loadingLogin,
    loginError,
    handleLogin,
    handleRegister,
    handleLogout,
    clearToken,
  };
}
