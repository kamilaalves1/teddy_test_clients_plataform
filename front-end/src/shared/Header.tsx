import logo from '../assets/logo.png';

function TeddyLogo() {
  return <img src={logo} alt="Teddy Open Finance" style={{ height: 32, display: 'block' }} />;
}

function Header({
  active,
  userName,
  onMenuToggle,
  onOpenClients,
  onOpenSelected,
  onLogout,
}: {
  active: 'home' | 'clients' | 'selected';
  userName: string;
  onMenuToggle: () => void;
  onOpenClients: () => void;
  onOpenSelected: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <div className="menu-logo">
        <button className="icon-button" aria-label="menu" onClick={onMenuToggle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect y="2" width="16" height="1.8" rx="0.9" fill="#555" />
            <rect y="7.1" width="16" height="1.8" rx="0.9" fill="#555" />
            <rect y="12.2" width="16" height="1.8" rx="0.9" fill="#555" />
          </svg>
        </button>
        <TeddyLogo />
      </div>

      <nav className="top-nav">
        <button
          className={active === 'clients' ? 'top-nav-link active' : 'top-nav-link'}
          onClick={onOpenClients}
        >
          Clientes
        </button>
        <button
          className={active === 'selected' ? 'top-nav-link active' : 'top-nav-link'}
          onClick={onOpenSelected}
        >
          Clientes selecionados
        </button>
        <button className="top-nav-link" onClick={onLogout}>
          Sair
        </button>
      </nav>

      <div className="welcome">
        Olá, <strong>{userName || 'Usuário'}!</strong>
      </div>
    </header>
  );
}

export default Header;
