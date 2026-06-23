import { useState, useEffect, useMemo } from 'react';
import { logsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, FileText, Search, RefreshCw, BarChart3, TrendingUp, Users, Activity } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import './AdminDashboard.css';
import './AdminLivres.css';
import './AdminLogs.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

const ACTION_COLORS = {
  create: 'badge-actif',
  update: 'badge-warn',
  delete: 'badge-retard',
  login:  'badge-rendu',
};

const CHART_PALETTE = [
  '#b8985c', '#22c55e', '#3b82f6', '#f59e0b',
  '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899',
];

function getActionBadge(action) {
  const lower = (action || '').toLowerCase();
  if (lower.includes('créa') || lower.includes('creat') || lower.includes('ajout')) return ACTION_COLORS.create;
  if (lower.includes('modif') || lower.includes('updat') || lower.includes('valid')) return ACTION_COLORS.update;
  if (lower.includes('suppr') || lower.includes('delet'))                            return ACTION_COLORS.delete;
  if (lower.includes('login') || lower.includes('connex'))                           return ACTION_COLORS.login;
  return ACTION_COLORS.login;
}

export default function AdminLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [showCharts, setShowCharts] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    logsAPI.getAll({ limit: 200 })
      .then(({ data }) => setLogs(data.logs))
      .catch(err => toast.error(err.response?.data?.message || 'Erreur lors du chargement des logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  // ─── Analytics computations ───
  const analytics = useMemo(() => {
    if (!logs.length) return null;

    // Activity by admin
    const byAdmin = {};
    logs.forEach(log => {
      const name = log.adminId
        ? `${log.adminId.prenom || ''} ${log.adminId.nom || ''}`.trim()
        : 'Inconnu';
      byAdmin[name] = (byAdmin[name] || 0) + 1;
    });
    const adminNames = Object.keys(byAdmin).sort((a, b) => byAdmin[b] - byAdmin[a]);
    const adminCounts = adminNames.map(n => byAdmin[n]);
    const mostActive = adminNames[0] || 'N/A';

    // Activity by action type
    const byAction = {};
    logs.forEach(log => {
      const a = log.action || 'AUTRE';
      byAction[a] = (byAction[a] || 0) + 1;
    });
    const actionLabels = Object.keys(byAction);
    const actionCounts = actionLabels.map(a => byAction[a]);

    // Activity over last 7 days
    const now = new Date();
    const days = [];
    const dayCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      const dayStr = d.toISOString().split('T')[0];
      days.push(label);
      dayCounts.push(
        logs.filter(l => l.createdAt && l.createdAt.startsWith(dayStr)).length
      );
    }

    return { adminNames, adminCounts, mostActive, actionLabels, actionCounts, days, dayCounts };
  }, [logs]);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.adminId?.prenom + ' ' + log.adminId?.nom).toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dash-spinner-wrap">
          <div className="dash-spinner" />
        </div>
      </div>
    );
  }

  // ─── Chart configs ───
  const barData = analytics ? {
    labels: analytics.adminNames,
    datasets: [{
      label: 'Actions',
      data: analytics.adminCounts,
      backgroundColor: analytics.adminNames.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
      borderRadius: 8,
      barThickness: 36,
    }]
  } : null;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--txt2)', font: { size: 11 } } },
      y: { grid: { color: 'rgba(150,150,150,0.1)' }, ticks: { color: 'var(--txt3)', stepSize: 1 } },
    },
  };

  const doughnutData = analytics ? {
    labels: analytics.actionLabels,
    datasets: [{
      data: analytics.actionCounts,
      backgroundColor: CHART_PALETTE.slice(0, analytics.actionLabels.length),
      borderWidth: 0,
      hoverOffset: 6,
    }]
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: "'Outfit', sans-serif" }, padding: 12, usePointStyle: true, pointStyleWidth: 10 } },
    },
    cutout: '65%',
  };

  const lineData = analytics ? {
    labels: analytics.days,
    datasets: [{
      label: 'Activités',
      data: analytics.dayCounts,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: '#3b82f6',
      pointBorderWidth: 2,
      pointBorderColor: 'var(--bg)',
    }]
  } : null;

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11, family: "'Outfit', sans-serif" } } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#9ca3af', stepSize: 1, font: { family: "'Outfit', sans-serif" } }, beginAtZero: true },
    },
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Journal d'Activité</h1>
          <p className="admin-date">Vue Super Admin — {logs.length} entrées</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className={`btn-icon ${showCharts ? 'active' : ''}`}
            onClick={() => setShowCharts(v => !v)}
            title="Basculer les graphiques"
          >
            <BarChart3 size={18} />
          </button>
          <button className="btn-icon" onClick={fetchLogs} title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ─── Charts Section ─── */}
      {showCharts && analytics && (
        <div className="logs-charts-section">
          {/* KPI Cards */}
          <div className="logs-kpis">
            <div className="logs-kpi-card">
              <div className="logs-kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                <Activity size={22} />
              </div>
              <div>
                <div className="logs-kpi-value">{logs.length}</div>
                <div className="logs-kpi-label">Total activités</div>
              </div>
            </div>
            <div className="logs-kpi-card">
              <div className="logs-kpi-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                <Users size={22} />
              </div>
              <div>
                <div className="logs-kpi-value">{analytics.adminNames.length}</div>
                <div className="logs-kpi-label">Admins actifs</div>
              </div>
            </div>
            <div className="logs-kpi-card">
              <div className="logs-kpi-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="logs-kpi-value">{analytics.mostActive}</div>
                <div className="logs-kpi-label">Plus actif</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="logs-charts-grid">
            <div className="logs-chart-card">
              <h3 className="logs-chart-title">
                <BarChart3 size={16} /> Activité par Admin
              </h3>
              <div className="logs-chart-body" style={{ height: 220 }}>
                {barData && <Bar data={barData} options={barOptions} />}
              </div>
            </div>
            <div className="logs-chart-card">
              <h3 className="logs-chart-title">
                <Activity size={16} /> Types d'Actions
              </h3>
              <div className="logs-chart-body" style={{ height: 220 }}>
                {doughnutData && <Doughnut data={doughnutData} options={doughnutOptions} />}
              </div>
            </div>
            <div className="logs-chart-card logs-chart-wide">
              <h3 className="logs-chart-title">
                <TrendingUp size={16} /> Activité des 7 derniers jours
              </h3>
              <div className="logs-chart-body" style={{ height: 200 }}>
                {lineData && <Line data={lineData} options={lineOptions} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="livres-toolbar" style={{ marginBottom: 22 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher dans les logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="dash-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Administrateur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--txt3)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="td-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="log-avatar" style={{ background: 'var(--bg3)', color: 'var(--txt1)', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, border: '1px solid var(--border)' }}>
                        {log.adminId?.prenom?.[0] || 'A'}{log.adminId?.nom?.[0] || 'D'}
                      </div>
                      {log.adminId?.prenom} {log.adminId?.nom}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--txt1)' }}>{log.entity}</td>
                  <td style={{ color: 'var(--txt2)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span className="log-details" title={log.details}>
                      {log.details}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="td-empty">
                    <Activity size={20} />
                    <br />Aucune activité enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
