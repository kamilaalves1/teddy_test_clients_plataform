import { type FormEvent, useState } from 'react';

type RegisterPageProps = {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onGoToLogin: () => void;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function RegisterPage({ onRegister, onGoToLogin }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) {
      next.name = 'Informe seu nome.';
    } else if (name.trim().length < 2) {
      next.name = 'Nome deve ter ao menos 2 caracteres.';
    }
    if (!email.trim()) {
      next.email = 'Informe seu e-mail.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      next.email = 'Informe um e-mail válido.';
    }
    if (!password) {
      next.password = 'Informe uma senha.';
    } else if (password.length < 6) {
      next.password = 'A senha deve ter ao menos 6 caracteres.';
    }
    if (!confirmPassword) {
      next.confirmPassword = 'Confirme sua senha.';
    } else if (confirmPassword !== password) {
      next.confirmPassword = 'As senhas não coincidem.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      setApiError('');
      await onRegister(name.trim(), email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('409') || msg.toLowerCase().includes('cadastrado')) {
        setApiError('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setApiError('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  return (
    <main className="login-page">
      <form className="login-box" onSubmit={submit} noValidate>
        <h1>Criar conta</h1>

        <div className="field-group">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
            placeholder="Digite seu nome:"
            aria-label="Nome"
            aria-invalid={!!errors.name}
            autoComplete="name"
            autoFocus
          />
          {errors.name && (
            <span className="field-error" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field-group">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            placeholder="Digite seu e-mail:"
            aria-label="E-mail"
            aria-invalid={!!errors.email}
            autoComplete="email"
          />
          {errors.email && (
            <span className="field-error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="field-group">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            placeholder="Crie uma senha:"
            aria-label="Senha"
            aria-invalid={!!errors.password}
            autoComplete="new-password"
          />
          {errors.password && (
            <span className="field-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <div className="field-group">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError('confirmPassword');
            }}
            placeholder="Confirme sua senha:"
            aria-label="Confirmar senha"
            aria-invalid={!!errors.confirmPassword}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span className="field-error" role="alert">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Criar conta'}
        </button>

        {apiError && (
          <p className="form-error" role="alert">
            {apiError}
          </p>
        )}

        <div className="login-divider">
          <span>ou</span>
        </div>

        <button type="button" className="login-register-link" onClick={onGoToLogin}>
          Já tenho conta
        </button>
      </form>
    </main>
  );
}

export default RegisterPage;
