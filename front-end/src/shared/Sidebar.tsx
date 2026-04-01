import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

function IconHome({ active }: { active: boolean }) {
  const c = active ? '#ef6820' : '#555';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M1.5 7L8 1.5L14.5 7V14H10V10H6V14H1.5V7Z"
        stroke={c}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClients({ active }: { active: boolean }) {
  const c = active ? '#ef6820' : '#555';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.8" stroke={c} strokeWidth="1.3" />
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconSelected({ active }: { active: boolean }) {
  const c = active ? '#ef6820' : '#555';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5.5" r="2.4" stroke={c} strokeWidth="1.3" />
      <path
        d="M1.5 14c0-2.8 2.2-4.5 4.5-4.5s4.5 1.7 4.5 4.5"
        stroke={c}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M10.5 6l1.5 1.5L14.5 4"
        stroke={c}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SidebarProps = {
  open: boolean;
  onCollapse: () => void;
};

function Sidebar({ open, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === '/home';
  const isClients = pathname === '/clients';
  const isSelected = pathname === '/selected-clients';

  return (
    <aside className={open ? 'sidebar' : 'sidebar sidebar-hidden'}>
      <div className="sidebar-logo-area">
        <img src={logo} alt="Teddy Open Finance" style={{ height: 32, display: 'block' }} />
      </div>

      <button
        className={isHome ? 'side-link active' : 'side-link'}
        onClick={() => navigate('/home')}
      >
        <IconHome active={isHome} />
        <span>Home</span>
      </button>

      <button
        className={isClients ? 'side-link active' : 'side-link'}
        onClick={() => navigate('/clients')}
      >
        <IconClients active={isClients} />
        <span>Clientes</span>
      </button>

      <button
        className={isSelected ? 'side-link active' : 'side-link'}
        onClick={() => navigate('/selected-clients')}
      >
        <IconSelected active={isSelected} />
        <span>Clientes selecionados</span>
      </button>

      <button className="sidebar-collapse-btn" onClick={onCollapse} aria-label="Recolher menu">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M6.5 2L3.5 5L6.5 8"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </aside>
  );
}

export default Sidebar;
