import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users, Search, Shield, ShieldOff, Trash2, Eye, X,
  UserCheck, UserX, Clock, BookOpen, Gift, TrendingUp,
  Calendar, Mail, Phone, Building2, AlertTriangle,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  ArrowUpDown, Filter, BarChart3, Activity,
  Ban, Unlock, Download, RefreshCw, UserPlus
} from 'lucide-react';
import { benevolesAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AdminBenevoles.css';

export default function AdminBenevoles() {
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');  // all, active, blocked
  const [sortBy, setSortBy] = useState('recent');           // recent, activity, name, loans, donations
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── FETCH ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [membersRes, statsRes] = await Promise.all([
        benevolesAPI.getAll(),
        benevolesAPI.getStats(),
      ]);
      setMembers(membersRes.data.members);
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  // ── ACTIONS ──────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      await usersAPI.toggleActive(id);
      toast.success('Statut mis à jour');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    try {
      await usersAPI.delete(id);
      toast.success('Compte supprimé');
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setConfirmAction(null);
  };

  const handleBulkToggle = async (actif) => {
    if (selectedIds.length === 0) return;
    try {
      await benevolesAPI.bulkToggle(selectedIds, actif);
      toast.success(`${selectedIds.length} compte(s) ${actif ? 'débloqué(s)' : 'bloqué(s)'}`);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setConfirmAction(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await benevolesAPI.bulkDelete(selectedIds);
      toast.success(res.data.message);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
    setConfirmAction(null);
  };

  // ── FILTERING + SORTING ──────────────────────────────
  const filtered = useMemo(() => {
    let list = [...members];

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(m =>
        `${m.prenom} ${m.nom} ${m.email} ${m.tel} ${m.departement} ${m.etablissement}`.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filterStatus === 'active') list = list.filter(m => m.actif);
    if (filterStatus === 'blocked') list = list.filter(m => !m.actif);

    // Sort
    switch (sortBy) {
      case 'activity':
        list.sort((a, b) => b.activityScore - a.activityScore);
        break;
      case 'name':
        list.sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));
        break;
      case 'loans':
        list.sort((a, b) => b.loanStats.totalLoans - a.loanStats.totalLoans);
        break;
      case 'donations':
        list.sort((a, b) => b.donationStats.totalDonations - a.donationStats.totalDonations);
        break;
      case 'recent':
      default:
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [members, searchTerm, filterStatus, sortBy]);

  // ── SELECT ───────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(m => m._id));
    }
  };

  // ── HELPERS ──────────────────────────────────────────
  const getInitials = (m) => {
    return ((m.prenom?.charAt(0) || '') + (m.nom?.charAt(0) || '')).toUpperCase() || '?';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getActivityLevel = (score) => {
    if (score >= 10) return { label: 'Très actif', cls: 'bvl-level-high', color: '#10b981' };
    if (score >= 5) return { label: 'Actif', cls: 'bvl-level-mid', color: '#f59e0b' };
    if (score >= 1) return { label: 'Modéré', cls: 'bvl-level-low', color: 'var(--gold)' };
    return { label: 'Inactif', cls: 'bvl-level-none', color: '#94a3b8' };
  };

  const topMembers = useMemo(() => {
    return [...members].sort((a, b) => b.activityScore - a.activityScore).slice(0, 5);
  }, [members]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-page bvl-page">

      {/* ══════════════════════════════════════════════════
           HERO HEADER
           ══════════════════════════════════════════════════ */}
      <div className="bvl-hero">
        <div className="bvl-hero-content">
          <div className="bvl-hero-icon">
            <Users size={28} />
          </div>
          <div>
            <h1>Comptes Bénévoles</h1>
            <p>Visualisez tous les comptes bénévoles créés. Seuls les utilisateurs ayant créé un compte bénévole apparaissent ici — pour des raisons de sécurité, chaque inscription est tracée.</p>
          </div>
        </div>
        <div className="bvl-hero-stats">
          <div className="bvl-stat">
            <span className="bvl-stat-val">{stats?.total || 0}</span>
            <span className="bvl-stat-label">Total</span>
          </div>
          <div className="bvl-stat-divider" />
          <div className="bvl-stat">
            <span className="bvl-stat-val bvl-stat-active">{stats?.actifs || 0}</span>
            <span className="bvl-stat-label">Actifs</span>
          </div>
          <div className="bvl-stat-divider" />
          <div className="bvl-stat">
            <span className="bvl-stat-val bvl-stat-blocked">{stats?.inactifs || 0}</span>
            <span className="bvl-stat-label">Bloqués</span>
          </div>
          <div className="bvl-stat-divider" />
          <div className="bvl-stat">
            <span className="bvl-stat-val bvl-stat-new">{stats?.newThisMonth || 0}</span>
            <span className="bvl-stat-label">Ce mois</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           TOP 5 — LES PLUS ACTIFS
           ══════════════════════════════════════════════════ */}
      {topMembers.length > 0 && (
        <div className="bvl-top-section">
          <div className="bvl-top-header">
            <TrendingUp size={18} />
            <h3>Top 5 — Bénévoles les plus actifs</h3>
          </div>
          <div className="bvl-top-cards">
            {topMembers.map((m, i) => {
              const level = getActivityLevel(m.activityScore);
              return (
                <div
                  key={m._id}
                  className="bvl-top-card"
                  onClick={() => setViewProfile(m)}
                >
                  <div className="bvl-top-rank">#{i + 1}</div>
                  <div className="bvl-top-avatar">
                    {getInitials(m)}
                  </div>
                  <div className="bvl-top-info">
                    <span className="bvl-top-name">{m.prenom} {m.nom}</span>
                    <div className="bvl-top-metrics">
                      <span title="Emprunts"><BookOpen size={12} /> {m.loanStats.totalLoans}</span>
                      <span title="Dons"><Gift size={12} /> {m.donationStats.totalDonations}</span>
                    </div>
                  </div>
                  <div className="bvl-top-score" style={{ '--score-color': level.color }}>
                    <Activity size={14} />
                    {m.activityScore}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           CONTROLS — RECHERCHE, FILTRES, TRI, ACTIONS MASSE
           ══════════════════════════════════════════════════ */}
      <div className="bvl-controls">
        <div className="bvl-controls-left">
          <div className="bvl-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bvl-filters">
            <button className={`bvl-filter ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
              Tous ({members.length})
            </button>
            <button className={`bvl-filter ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>
              <UserCheck size={14} /> Actifs
            </button>
            <button className={`bvl-filter ${filterStatus === 'blocked' ? 'active' : ''}`} onClick={() => setFilterStatus('blocked')}>
              <UserX size={14} /> Bloqués
            </button>
          </div>
        </div>
        <div className="bvl-controls-right">
          <div className="bvl-sort">
            <ArrowUpDown size={14} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Plus récents</option>
              <option value="activity">Plus actifs</option>
              <option value="name">Alphabétique</option>
              <option value="loans">Emprunts</option>
              <option value="donations">Dons</option>
            </select>
          </div>
          <button className="bvl-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Actualiser">
            <RefreshCw size={16} className={refreshing ? 'bvl-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── BULK ACTIONS ────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="bvl-bulk-bar">
          <div className="bvl-bulk-count">
            <CheckCircle size={16} />
            <span>{selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
          </div>
          <div className="bvl-bulk-actions">
            <button className="bvl-bulk-btn bvl-bulk-block" onClick={() => setConfirmAction({ type: 'bulk-block' })}>
              <Ban size={14} /> Bloquer
            </button>
            <button className="bvl-bulk-btn bvl-bulk-unblock" onClick={() => setConfirmAction({ type: 'bulk-unblock' })}>
              <Unlock size={14} /> Débloquer
            </button>
            <button className="bvl-bulk-btn bvl-bulk-delete" onClick={() => setConfirmAction({ type: 'bulk-delete' })}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
          <button className="bvl-bulk-clear" onClick={() => setSelectedIds([])}>
            <X size={14} /> Tout désélectionner
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           TABLE DES BÉNÉVOLES
           ══════════════════════════════════════════════════ */}
      <div className="bvl-table-card">
        <div className="bvl-table-wrap">
          <table className="bvl-table">
            <thead>
              <tr>
                <th className="bvl-th-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                    className="bvl-checkbox"
                  />
                </th>
                <th>Bénévole</th>
                <th>Contact</th>
                <th>Activité</th>
                <th>Emprunts</th>
                <th>Dons</th>
                <th>Statut</th>
                <th>Bénévole depuis</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const level = getActivityLevel(m.activityScore);
                const isExpanded = expandedId === m._id;
                return (
                  <React.Fragment key={m._id}>
                    <tr
                      className={`bvl-row ${selectedIds.includes(m._id) ? 'bvl-row-selected' : ''} ${!m.actif ? 'bvl-row-blocked' : ''}`}
                      style={{ animationDelay: `${i * 0.03}s` }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(m._id)}
                          onChange={() => toggleSelect(m._id)}
                          className="bvl-checkbox"
                        />
                      </td>
                      <td>
                        <div className="bvl-td-user">
                          <div className={`bvl-td-avatar ${!m.actif ? 'bvl-avatar-blocked' : ''}`}>
                            {getInitials(m)}
                            {!m.actif && <div className="bvl-avatar-ban-overlay"><Ban size={14} /></div>}
                          </div>
                          <div className="bvl-td-user-info">
                            <span className="bvl-td-name">{m.prenom} {m.nom}</span>
                            {m.etablissement && (
                              <span className="bvl-td-etab">
                                <Building2 size={11} /> {m.etablissement}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="bvl-td-contact">
                          <span><Mail size={12} /> {m.email}</span>
                          {m.tel && <span><Phone size={12} /> {m.tel}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={`bvl-activity-badge ${level.cls}`}>
                          <Activity size={12} />
                          <span>{m.activityScore}</span>
                          <span className="bvl-activity-label">{level.label}</span>
                        </div>
                      </td>
                      <td>
                        <div className="bvl-td-stat-group">
                          <span className="bvl-td-stat-main">{m.loanStats.totalLoans}</span>
                          {m.loanStats.activeLoans > 0 && (
                            <span className="bvl-td-stat-sub bvl-sub-active">{m.loanStats.activeLoans} actif{m.loanStats.activeLoans > 1 ? 's' : ''}</span>
                          )}
                          {m.loanStats.lateLoans > 0 && (
                            <span className="bvl-td-stat-sub bvl-sub-late">{m.loanStats.lateLoans} en retard</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="bvl-td-stat-group">
                          <span className="bvl-td-stat-main">{m.donationStats.totalDonations}</span>
                          {m.donationStats.approvedDonations > 0 && (
                            <span className="bvl-td-stat-sub bvl-sub-approved">{m.donationStats.approvedDonations} approuvé{m.donationStats.approvedDonations > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {m.actif ? (
                          <span className="bvl-status-badge bvl-badge-active">
                            <CheckCircle size={12} /> Actif
                          </span>
                        ) : (
                          <span className="bvl-status-badge bvl-badge-blocked">
                            <Ban size={12} /> Bloqué
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="bvl-td-date">
                          <Calendar size={12} />
                          {formatDate(m.benevoleRegisteredAt || m.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="bvl-td-actions">
                          <button
                            className="bvl-action-btn bvl-action-view"
                            onClick={() => setViewProfile(m)}
                            title="Voir le profil"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className={`bvl-action-btn ${m.actif ? 'bvl-action-block' : 'bvl-action-unblock'}`}
                            onClick={() => setConfirmAction({ type: 'toggle', member: m })}
                            title={m.actif ? 'Bloquer' : 'Débloquer'}
                          >
                            {m.actif ? <Ban size={15} /> : <Unlock size={15} />}
                          </button>
                          <button
                            className="bvl-action-btn bvl-action-delete"
                            onClick={() => setConfirmAction({ type: 'delete', member: m })}
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            className="bvl-action-btn bvl-action-expand"
                            onClick={() => setExpandedId(isExpanded ? null : m._id)}
                            title="Détails"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── EXPANDED ROW ──────────────────── */}
                    {isExpanded && (
                      <tr className="bvl-expanded-row">
                        <td colSpan="9">
                          <div className="bvl-expanded-content">
                            <div className="bvl-expanded-grid">
                              <div className="bvl-expanded-card">
                                <h4><BookOpen size={14} /> Emprunts</h4>
                                <div className="bvl-expanded-stats">
                                  <div><span>{m.loanStats.totalLoans}</span><small>Total</small></div>
                                  <div><span className="c-green">{m.loanStats.returned}</span><small>Rendus</small></div>
                                  <div><span className="c-blue">{m.loanStats.activeLoans}</span><small>Actifs</small></div>
                                  <div><span className="c-red">{m.loanStats.lateLoans}</span><small>En retard</small></div>
                                  <div><span className="c-amber">{m.loanStats.pending}</span><small>En attente</small></div>
                                </div>
                              </div>
                              <div className="bvl-expanded-card">
                                <h4><Gift size={14} /> Dons</h4>
                                <div className="bvl-expanded-stats">
                                  <div><span>{m.donationStats.totalDonations}</span><small>Total</small></div>
                                  <div><span className="c-green">{m.donationStats.approvedDonations}</span><small>Approuvés</small></div>
                                  <div><span className="c-amber">{m.donationStats.pendingDonations}</span><small>En attente</small></div>
                                  <div><span className="c-red">{m.donationStats.rejectedDonations}</span><small>Rejetés</small></div>
                                </div>
                              </div>
                              <div className="bvl-expanded-card">
                                <h4><Activity size={14} /> Profil</h4>
                                <div className="bvl-expanded-profile">
                                  <div><small>Sexe</small><span>{m.sexe === 'M' ? 'Masculin' : m.sexe === 'F' ? 'Féminin' : '—'}</span></div>
                                  <div><small>Département</small><span>{m.departement || '—'}</span></div>
                                  <div><small>Campus</small><span>{m.logeCampus ? `Oui (${m.chambre || '—'})` : 'Non'}</span></div>
                                  <div><small>Dernière connexion</small><span>{formatDate(m.lastLogin)}</span></div>
                                  <div><small>Partenariat</small><span className={`bvl-partner-${m.partnerStatus}`}>{m.partnerStatus === 'approved' ? 'Partenaire' : m.partnerStatus === 'pending' ? 'En attente' : m.partnerStatus === 'rejected' ? 'Refusé' : 'Aucun'}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="9" className="bvl-td-empty">
                    <Users size={32} />
                    <span>Aucun bénévole trouvé.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bvl-table-footer">
          <span>{filtered.length} bénévole{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
           MODAL — PROFIL DÉTAILLÉ
           ══════════════════════════════════════════════════ */}
      {viewProfile && (
        <div className="bvl-modal-overlay" onClick={() => setViewProfile(null)}>
          <div className="bvl-modal bvl-profile-modal" onClick={e => e.stopPropagation()}>
            <button className="bvl-modal-close" onClick={() => setViewProfile(null)}>
              <X size={18} />
            </button>

            <div className="bvl-profile-header">
              <div className={`bvl-profile-avatar ${!viewProfile.actif ? 'bvl-avatar-blocked' : ''}`}>
                {getInitials(viewProfile)}
              </div>
              <h2>{viewProfile.prenom} {viewProfile.nom}</h2>
              <div className="bvl-profile-badges">
                {viewProfile.actif ? (
                  <span className="bvl-status-badge bvl-badge-active"><CheckCircle size={12} /> Actif</span>
                ) : (
                  <span className="bvl-status-badge bvl-badge-blocked"><Ban size={12} /> Bloqué</span>
                )}
                {viewProfile.partnerStatus === 'approved' && (
                  <span className="bvl-status-badge bvl-badge-partner"><Shield size={12} /> Partenaire</span>
                )}
              </div>
            </div>

            <div className="bvl-profile-grid">
              <div className="bvl-profile-section">
                <h4>Informations personnelles</h4>
                <div className="bvl-profile-fields">
                  <div><Mail size={14} /><span>{viewProfile.email}</span></div>
                  <div><Phone size={14} /><span>{viewProfile.tel || '—'}</span></div>
                  <div><Building2 size={14} /><span>{viewProfile.etablissement || '—'}</span></div>
                  <div><Calendar size={14} /><span>Compte créé le {formatDate(viewProfile.createdAt)}</span></div>
                  <div><UserPlus size={14} /><span>Bénévole depuis le {formatDate(viewProfile.benevoleRegisteredAt || viewProfile.createdAt)}</span></div>
                  <div><Clock size={14} /><span>Dernière connexion : {formatDate(viewProfile.lastLogin)}</span></div>
                </div>
              </div>

              <div className="bvl-profile-section">
                <h4>Statistiques d'activité</h4>
                <div className="bvl-profile-stat-grid">
                  <div className="bvl-profile-stat-card">
                    <BookOpen size={20} />
                    <span className="bvl-profile-stat-val">{viewProfile.loanStats.totalLoans}</span>
                    <span className="bvl-profile-stat-label">Emprunts</span>
                  </div>
                  <div className="bvl-profile-stat-card">
                    <Gift size={20} />
                    <span className="bvl-profile-stat-val">{viewProfile.donationStats.totalDonations}</span>
                    <span className="bvl-profile-stat-label">Dons</span>
                  </div>
                  <div className="bvl-profile-stat-card">
                    <Activity size={20} />
                    <span className="bvl-profile-stat-val">{viewProfile.activityScore}</span>
                    <span className="bvl-profile-stat-label">Score</span>
                  </div>
                  <div className="bvl-profile-stat-card">
                    <TrendingUp size={20} />
                    <span className="bvl-profile-stat-val">{getActivityLevel(viewProfile.activityScore).label}</span>
                    <span className="bvl-profile-stat-label">Niveau</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bvl-profile-actions">
              <button
                className={`bvl-profile-action-btn ${viewProfile.actif ? 'bvl-btn-block' : 'bvl-btn-unblock'}`}
                onClick={() => { handleToggle(viewProfile._id); setViewProfile(null); }}
              >
                {viewProfile.actif ? <><Ban size={16} /> Bloquer ce compte</> : <><Unlock size={16} /> Débloquer ce compte</>}
              </button>
              <button
                className="bvl-profile-action-btn bvl-btn-delete"
                onClick={() => { setViewProfile(null); setConfirmAction({ type: 'delete', member: viewProfile }); }}
              >
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           MODAL — CONFIRMATION
           ══════════════════════════════════════════════════ */}
      {confirmAction && (
        <div className="bvl-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="bvl-modal bvl-confirm-modal" onClick={e => e.stopPropagation()}>
            <button className="bvl-modal-close" onClick={() => setConfirmAction(null)}>
              <X size={18} />
            </button>

            {/* TOGGLE */}
            {confirmAction.type === 'toggle' && (
              <>
                <div className={`bvl-confirm-icon-wrap ${confirmAction.member.actif ? 'bvl-wrap-warn' : 'bvl-wrap-success'}`}>
                  {confirmAction.member.actif ? <Ban size={32} /> : <Unlock size={32} />}
                </div>
                <h3>{confirmAction.member.actif ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?'}</h3>
                <p>
                  {confirmAction.member.actif
                    ? `${confirmAction.member.prenom} ${confirmAction.member.nom} ne pourra plus accéder à la plateforme.`
                    : `${confirmAction.member.prenom} ${confirmAction.member.nom} retrouvera l'accès à la plateforme.`
                  }
                </p>
                <div className="bvl-confirm-actions">
                  <button className="bvl-confirm-btn bvl-btn-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
                  <button className={`bvl-confirm-btn ${confirmAction.member.actif ? 'bvl-btn-block' : 'bvl-btn-unblock'}`} onClick={() => { handleToggle(confirmAction.member._id); setConfirmAction(null); }}>
                    {confirmAction.member.actif ? <><Ban size={14} /> Bloquer</> : <><Unlock size={14} /> Débloquer</>}
                  </button>
                </div>
              </>
            )}

            {/* DELETE */}
            {confirmAction.type === 'delete' && (
              <>
                <div className="bvl-confirm-icon-wrap bvl-wrap-danger">
                  <Trash2 size={32} />
                </div>
                <h3>Supprimer ce compte ?</h3>
                <p>
                  Le compte de <strong>{confirmAction.member.prenom} {confirmAction.member.nom}</strong> sera définitivement supprimé. Cette action est irréversible.
                </p>
                <div className="bvl-confirm-warning">
                  <AlertTriangle size={16} />
                  <span>Les emprunts en cours empêcheront la suppression.</span>
                </div>
                <div className="bvl-confirm-actions">
                  <button className="bvl-confirm-btn bvl-btn-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
                  <button className="bvl-confirm-btn bvl-btn-delete" onClick={() => handleDelete(confirmAction.member._id)}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </>
            )}

            {/* BULK BLOCK */}
            {confirmAction.type === 'bulk-block' && (
              <>
                <div className="bvl-confirm-icon-wrap bvl-wrap-warn">
                  <Ban size={32} />
                </div>
                <h3>Bloquer {selectedIds.length} compte{selectedIds.length > 1 ? 's' : ''} ?</h3>
                <p>Les bénévoles sélectionnés ne pourront plus accéder à la plateforme.</p>
                <div className="bvl-confirm-actions">
                  <button className="bvl-confirm-btn bvl-btn-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
                  <button className="bvl-confirm-btn bvl-btn-block" onClick={() => handleBulkToggle(false)}>
                    <Ban size={14} /> Bloquer tout
                  </button>
                </div>
              </>
            )}

            {/* BULK UNBLOCK */}
            {confirmAction.type === 'bulk-unblock' && (
              <>
                <div className="bvl-confirm-icon-wrap bvl-wrap-success">
                  <Unlock size={32} />
                </div>
                <h3>Débloquer {selectedIds.length} compte{selectedIds.length > 1 ? 's' : ''} ?</h3>
                <p>Les bénévoles sélectionnés retrouveront l'accès à la plateforme.</p>
                <div className="bvl-confirm-actions">
                  <button className="bvl-confirm-btn bvl-btn-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
                  <button className="bvl-confirm-btn bvl-btn-unblock" onClick={() => handleBulkToggle(true)}>
                    <Unlock size={14} /> Débloquer tout
                  </button>
                </div>
              </>
            )}

            {/* BULK DELETE */}
            {confirmAction.type === 'bulk-delete' && (
              <>
                <div className="bvl-confirm-icon-wrap bvl-wrap-danger">
                  <Trash2 size={32} />
                </div>
                <h3>Supprimer {selectedIds.length} compte{selectedIds.length > 1 ? 's' : ''} ?</h3>
                <p>Cette action est irréversible. Tous les comptes sélectionnés seront définitivement supprimés.</p>
                <div className="bvl-confirm-warning">
                  <AlertTriangle size={16} />
                  <span>Les comptes avec des emprunts en cours ne seront pas supprimés.</span>
                </div>
                <div className="bvl-confirm-actions">
                  <button className="bvl-confirm-btn bvl-btn-cancel" onClick={() => setConfirmAction(null)}>Annuler</button>
                  <button className="bvl-confirm-btn bvl-btn-delete" onClick={handleBulkDelete}>
                    <Trash2 size={14} /> Supprimer tout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
