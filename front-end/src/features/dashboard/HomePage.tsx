import { type Client } from '../../shared/api';
import { formatCurrency } from '../../shared/currency';
import AppLayout from '../../shared/AppLayout';

type HomePageProps = {
  userName: string;
  clients: Client[];
  onLogout: () => void;
};

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function buildMonthlyData(clients: Client[]) {
  const now = new Date();
  const months: { label: string; total: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      total: 0,
    });
  }

  clients.forEach((c) => {
    const created = new Date(c.createdAt);
    for (let i = 0; i < months.length; i++) {
      const offset = 5 - i;
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      if (created >= d && created < next) {
        months[i].total += 1;
        break;
      }
    }
  });

  return months;
}

type StatCardProps = {
  label: string;
  value: string | number;
  accent?: boolean;
};

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className={`dash-card${accent ? ' dash-card--accent' : ''}`}>
      <span className="dash-card__label">{label}</span>
      <strong className="dash-card__value">{value}</strong>
    </div>
  );
}

type MiniBarChartProps = {
  data: Array<{ label: string; total: number }>;
};

function MiniBarChart({ data }: MiniBarChartProps) {
  const maxTotal = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="dash-chart" role="img" aria-label="Clientes cadastrados nos últimos 6 meses">
      {data.map((item) => {
        const height = item.total === 0 ? 0 : Math.max((item.total / maxTotal) * 100, 14);

        return (
          <div key={item.label} className="dash-chart__item">
            <span className="dash-chart__value">{item.total}</span>
            <div className="dash-chart__track" aria-hidden="true">
              <div className="dash-chart__bar" style={{ height: `${height}%` }} />
            </div>
            <span className="dash-chart__label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HomePage({ userName, clients, onLogout }: HomePageProps) {
  const totalSalary = clients.reduce((s, c) => s + Number(c.salary), 0);
  const totalCompany = clients.reduce((s, c) => s + Number(c.companyValue), 0);
  const mostAccessed = clients.reduce<Client | null>(
    (max, c) => (!max || c.accessCount > max.accessCount ? c : max),
    null,
  );
  const monthlyData = buildMonthlyData(clients);
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <AppLayout active="home" userName={userName} onLogout={onLogout}>
      <main className="dash-main">
        <h2 className="dash-title">Dashboard</h2>

        <div className="dash-cards">
          <StatCard label="Total de clientes" value={clients.length} accent />
          <StatCard label="Soma dos salários" value={formatCurrency(totalSalary)} />
          <StatCard label="Valor total em empresas" value={formatCurrency(totalCompany)} />
          <StatCard
            label="Cliente mais acessado"
            value={mostAccessed ? `${mostAccessed.name} (${mostAccessed.accessCount}x)` : '—'}
          />
        </div>

        <div className="dash-bottom">
          <section className="dash-chart-box">
            <h3 className="dash-section-title">Clientes cadastrados (últimos 6 meses)</h3>
            <MiniBarChart data={monthlyData} />
          </section>

          <section className="dash-recent-box">
            <h3 className="dash-section-title">Últimos clientes</h3>
            {recentClients.length === 0 ? (
              <p className="dash-empty">Nenhum cliente cadastrado ainda.</p>
            ) : (
              <ul className="dash-recent-list">
                {recentClients.map((c) => (
                  <li key={c.id} className="dash-recent-item">
                    <div className="dash-recent-name">{c.name}</div>
                    <div className="dash-recent-info">
                      <span>{formatCurrency(Number(c.salary))}</span>
                      <time className="dash-recent-date">
                        {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </AppLayout>
  );
}

export default HomePage;
