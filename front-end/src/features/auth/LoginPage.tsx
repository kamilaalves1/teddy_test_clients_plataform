import { type FormEvent, useState } from 'react';

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoToRegister: () => void;
  loading: boolean;
  error: string;
};

function LoginPage({ onLogin, onGoToRegister, loading, error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Informe seu e-mail.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Informe um e-mail válido.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Informe sua senha.');
      valid = false;
    }
    return valid;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onLogin(email.trim(), password);
  };

  return (
    <main className="login-page">
      <form className="login-box" onSubmit={submit} noValidate>
        <h1>Olá, seja bem-vindo!</h1>

        <div className="field-group">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            placeholder="Digite seu e-mail:"
            aria-label="E-mail"
            aria-invalid={!!emailError}
            autoComplete="email"
            autoFocus
          />
          {emailError && (
            <span className="field-error" role="alert">
              {emailError}
            </span>
          )}
        </div>

        <div className="field-group">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            placeholder="Digite sua senha:"
            aria-label="Senha"
            aria-invalid={!!passwordError}
            autoComplete="current-password"
            maxLength={10}
          />
          {passwordError && (
            <span className="field-error" role="alert">
              {passwordError}
            </span>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="login-divider">
          <span>ou</span>
        </div>

        <button type="button" className="login-register-link" onClick={onGoToRegister}>
          Criar conta
        </button>
      </form>
    </main>
  );
}

export default LoginPage;
