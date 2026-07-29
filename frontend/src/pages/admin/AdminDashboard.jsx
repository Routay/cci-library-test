import { Link } from 'react-router-dom';
import { useDashStats } from '../../hooks/useUsers';
import { loansAPI, reportAPI } from '../../services/api';
import {
  Book, ClipboardList, Clock, AlertTriangle, BookOpen,
  Star, UserPlus, CheckCircle, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3,
  Activity, Eye, Percent, CalendarCheck, Crown, Flame, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import GrowthChart from '../../components/GrowthChart';
import VisitorChart from '../../components/VisitorChart';
import CategoryChart from '../../components/CategoryChart';
import './AdminDashboard.css';
import { useState } from 'react';

const STATUS_LABELS = { en_attente: 'En attente', actif: 'Actif', retard: 'En retard', rendu: 'Rendu' };
const STATUS_CLASS  = { en_attente: 'badge-warn', actif: 'badge-actif', retard: 'badge-retard', rendu: 'badge-rendu' };

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

export default function AdminDashboard() {
  const { stats, loading, error, refetch } = useDashStats();
  const [generatingReport, setGeneratingReport] = useState(false);
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) return <div className="admin-dashboard"><Spinner /></div>;
  if (error) return (
    <div className="admin-dashboard dash-error-state">
      <div className="dash-error-card">
        <AlertTriangle size={32} color="#ef4444" />
        <p>{error}</p>
        <button className="btn btn-outline" onClick={refetch}>
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    </div>
  );
  if (!stats) return <div className="admin-dashboard"><Spinner /></div>;

  const {
    kpis = {},
    recentLoans = [],
    lowStock = [],
    activeMembers = [],
    topBooks = [],
    categoryBreakdown = [],
    criticalOverdue = [],
  } = stats;

  const KPIS = [
    { label: 'Total livres',    value: kpis.totalBooks   ?? 0, icon: <Book size={22} strokeWidth={1.5} />,          color: 'teal',   link: '/admin/livres'   },
    { label: 'Emprunts actifs', value: kpis.activeLoans  ?? 0, icon: <ClipboardList size={22} strokeWidth={1.5} />, color: 'blue',   link: '/admin/emprunts', state: { filter: 'actif' } },
    { label: 'En attente',      value: kpis.pendingLoans ?? 0, icon: <Clock size={22} strokeWidth={1.5} />,         color: 'orange', link: '/admin/emprunts', state: { filter: 'en_attente' } },
    { label: 'En retard',       value: kpis.overdueLoans ?? 0, icon: <AlertTriangle size={22} strokeWidth={1.5} />, color: 'red',    link: '/admin/emprunts', state: { filter: 'retard' } },
    { label: 'Membres actifs',  value: kpis.totalMembers ?? 0, icon: <Users size={22} strokeWidth={1.5} />,         color: 'green',  link: '/admin/membres'  },
    { label: 'Taux retour',     value: `${kpis.returnRate ?? 100}%`, icon: <Percent size={22} strokeWidth={1.5} />, color: 'purple', link: '/admin/emprunts' },
    { label: 'Rendus ce mois',  value: kpis.returnedThisMonth ?? 0, icon: <CalendarCheck size={22} strokeWidth={1.5} />, color: 'indigo', link: '/admin/emprunts', state: { filter: 'rendu' } },
  ];

  const handleReturn = async (id) => {
    try { 
      await loansAPI.markReturned(id); 
      toast.success('Emprunt marqué comme rendu');
      refetch(); 
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Erreur lors du retour'); 
    }
  };
  const handleValidate = async (id) => {
    try { 
      await loansAPI.update(id, { status: 'actif' }); 
      toast.success('Emprunt validé et email envoyé');
      refetch(); 
    } catch (e) { 
      toast.error('Erreur lors de la validation'); 
    }
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await reportAPI.downloadWeekly();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from content-disposition or use default
      const disposition = res.headers['content-disposition'];
      const filenameMatch = disposition && disposition.match(/filename="?([^"]+)"?/);
      a.download = filenameMatch ? filenameMatch[1] : 'Rapport_CCI.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Rapport téléchargé avec succès');
    } catch (e) {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* ─── Header ────────────────────────────────────── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-greeting">
            <h1>Dashboard</h1>
            <span className="dash-live-dot" />
          </div>
          <p className="dash-date">{today}</p>
        </div>
        <div className="dash-header-right">
          <button className="btn-icon" onClick={refetch} title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
          <Link to="/admin/livres" className="btn btn-primary">
            <BookOpen size={16} /> Ajouter un livre
          </Link>
          <Link to="/admin/emprunts" className="btn btn-outline">
            <ClipboardList size={16} /> Nouvel emprunt
          </Link>
          <button
            className="btn btn-report"
            onClick={handleDownloadReport}
            disabled={generatingReport}
          >
            <FileText size={16} />
            {generatingReport ? 'Génération...' : 'Rapport'}
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─────────────────────────────────── */}
      <div className="kpi-grid kpi-grid-7">
        {KPIS.map((k) => (
          <Link to={k.link} state={k.state} key={k.label} className={`kpi-card kpi-${k.color}`}>
            <div className="kpi-icon-wrap">{k.icon}</div>
            <div className="kpi-info">
              <span className="kpi-value">{k.value}</span>
              <span className="kpi-label">{k.label}</span>
            </div>
            <ArrowUpRight size={14} className="kpi-arrow" />
          </Link>
        ))}
      </div>

      {/* ─── Charts Section ────────────────────────────── */}
      <div className="charts-grid">
        <div className="dash-card chart-card">
          <div className="dash-card-header">
            <div className="card-title-group">
              <Activity size={18} className="card-title-icon" />
              <h2>Évolution — Emprunts & Membres</h2>
            </div>
            <span className="card-badge">6 mois</span>
          </div>
          <div className="chart-body">
            <GrowthChart />
          </div>
        </div>

        <div className="dash-card chart-card">
          <div className="dash-card-header">
            <div className="card-title-group">
              <Eye size={18} className="card-title-icon" />
              <h2>Visiteurs du site</h2>
            </div>
            <span className="card-badge">30 jours</span>
          </div>
          <VisitorChart />
        </div>
      </div>

      {/* ─── Top Books + Category Breakdown ────────────── */}
      <div className="charts-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="card-title-group">
              <Crown size={18} className="card-title-icon icon-gold" />
              <h2>Top 5 — Livres les plus empruntés</h2>
            </div>
          </div>
          <div className="top-books-list">
            {topBooks.length === 0 ? (
              <div className="top-books-empty">
                <BookOpen size={20} />
                <span>Aucun emprunt enregistré</span>
              </div>
            ) : (
              topBooks.map((book, i) => (
                <div key={book._id} className="top-book-item">
                  <div className={`top-book-rank rank-${i + 1}`}>{i + 1}</div>
                  <div className="top-book-info">
                    <span className="top-book-title">{book.title}</span>
                    <span className="top-book-author">{book.author || book.category || ''}</span>
                  </div>
                  <div className="top-book-count">
                    <span className="top-book-count-val">{book.count}</span>
                    <span className="top-book-count-label">emprunts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dash-card chart-card">
          <div className="dash-card-header">
            <div className="card-title-group">
              <BarChart3 size={18} className="card-title-icon" />
              <h2>Répartition par catégorie</h2>
            </div>
          </div>
          <CategoryChart data={categoryBreakdown} />
        </div>
      </div>

      {/* ─── Main Content Grid ─────────────────────────── */}
      <div className="dashboard-grid">
        {/* Emprunts récents */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="card-title-group">
              <BarChart3 size={18} className="card-title-icon" />
              <h2>Emprunts récents</h2>
            </div>
            <Link to="/admin/emprunts" className="see-all">Voir tout →</Link>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Livre</th>
                  <th>Retour prévu</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentLoans.map((loan, i) => (
                  <tr key={loan._id} className={loan.status === 'retard' ? 'row-alert' : ''} style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="td-name">
                      {loan.member?.prenom} {loan.member?.nom}
                    </td>
                    <td className="td-book">{loan.book?.title}</td>
                    <td className={loan.status === 'retard' ? 'td-overdue' : ''}>
                      {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[loan.status]}`}>
                        {STATUS_LABELS[loan.status]}
                      </span>
                    </td>
                    <td>
                      {loan.status === 'en_attente' && (
                        <button className="row-btn rb-gold" onClick={() => handleValidate(loan._id)}>
                          <CheckCircle size={14} /> Valider
                        </button>
                      )}
                      {(loan.status === 'actif' || loan.status === 'retard') && (
                        <button className="row-btn rb-green" onClick={() => handleReturn(loan._id)}>
                          <CheckCircle size={14} /> Rendu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {recentLoans.length === 0 && (
                  <tr>
                    <td colSpan={5} className="td-empty">
                      Aucun emprunt enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="dash-side">
          {/* Retards critiques */}
          {criticalOverdue.length > 0 && (
            <div className="dash-card critical-card">
              <div className="dash-card-header">
                <div className="card-title-group">
                  <Flame size={18} className="card-title-icon icon-red" />
                  <h2>Retards critiques</h2>
                </div>
                <span className="card-badge badge-alert">{criticalOverdue.length}</span>
              </div>
              <ul className="critical-list">
                {criticalOverdue.map(loan => {
                  const daysLate = Math.ceil((new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24));
                  return (
                    <li key={loan._id} className="critical-item">
                      <div className="critical-info">
                        <span className="critical-member">{loan.member?.prenom} {loan.member?.nom}</span>
                        <span className="critical-book">{loan.book?.title}</span>
                      </div>
                      <span className="critical-days">{daysLate}j</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Actions rapides */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <TrendingUp size={18} className="card-title-icon" />
                <h2>Actions rapides</h2>
              </div>
            </div>
            <div className="quick-actions">
              <Link to="/admin/livres"   className="qa-btn qa-green"><BookOpen size={18} /> Ajouter un livre</Link>
              <Link to="/admin/emprunts" className="qa-btn qa-blue"><ClipboardList size={18} /> Enregistrer emprunt</Link>
              <Link to="/admin/semaine"  className="qa-btn qa-gold"><Star size={18} /> Livre de la semaine</Link>
              <Link to="/admin/membres"  className="qa-btn qa-teal"><UserPlus size={18} /> Ajouter membre</Link>
            </div>
          </div>

          {/* Alertes stock */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <AlertTriangle size={18} className="card-title-icon icon-red" />
                <h2>Alertes stock</h2>
              </div>
              <span className="card-badge badge-alert">{lowStock.length}</span>
            </div>
            <ul className="alert-list">
              {lowStock.length === 0 && (
                <li className="alert-item alert-ok">
                  <CheckCircle size={16} /> Tous les stocks sont OK
                </li>
              )}
              {lowStock.map((b) => (
                <li key={b._id} className="alert-item">
                  <span className="alert-title">{b.title}</span>
                  <span className={`badge ${b.stock === 0 ? 'badge-retard' : 'badge-warn'}`}>
                    {b.stock === 0 ? 'Épuisé' : `${b.stock} ex.`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Membres actifs */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="card-title-group">
                <Users size={18} className="card-title-icon" />
                <h2>Membres actifs</h2>
              </div>
              <Link to="/admin/membres" className="see-all">Gérer →</Link>
            </div>
            <ul className="members-list">
              {activeMembers.slice(0, 6).map(m => (
                <li key={m._id} className="member-item">
                  <div className="member-avatar">
                    {(m.prenom?.[0] || '').toUpperCase()}{(m.nom?.[0] || '').toUpperCase()}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{m.prenom} {m.nom}</span>
                    <span className="member-email">{m.email}</span>
                  </div>
                </li>
              ))}
              {activeMembers.length === 0 && (
                <li className="alert-item alert-ok">
                  <Users size={16} /> Aucun membre actif
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}