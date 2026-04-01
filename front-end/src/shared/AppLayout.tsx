import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

type AppLayoutProps = {
  active: 'home' | 'clients' | 'selected';
  userName: string;
  onLogout: () => void;
  children: React.ReactNode;
};

function AppLayout({ active, userName, onLogout, children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const layoutClassName = `app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`;

  return (
    <div className={layoutClassName}>
      <Sidebar open={sidebarOpen} onCollapse={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <section className="content">
        <Header
          active={active}
          userName={userName}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          onOpenClients={() => navigate('/clients')}
          onOpenSelected={() => navigate('/selected-clients')}
          onLogout={onLogout}
        />
        {children}
      </section>
    </div>
  );
}

export default AppLayout;
