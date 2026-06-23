import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Shield, UserPlus, Search, Pencil, KeyRound,
  Users, ShieldCheck, ShieldAlert, Calendar,
  XCircle, RefreshCw, Crown,
} from 'lucide-react';
import './AdminDashboard.css';
import './AdminGestion.css';

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

function getPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

const EMPTY_ADMIN = { nom: '', prenom: '', email: '', tel: '', password: '', role: 'admin' };

export default function AdminGestion() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // 'add' | 'password' | 'role'
  const [current, setCurrent]   = useState(EMPTY_ADMIN);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [passwordData, setPasswordData] = useState({ password: '', confirm: '' });
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getAdmins();
      setAdmins(data.admins || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur chargement admins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const filtered = admins.filter(a =>
    `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins  = admins.length;
  const activeAdmins = admins.filter(a => a.actif).length;
  const superAdmins  = admins.filter(a => a.role === 'super_admin').length;
  const recentAdmin  = admins.length > 0
    ? admins.reduce((latest, a) => new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest)
    : null;

  // ── Handlers ──

  const openAdd = () => {
    setCurrent(EMPTY_ADMIN);
    setApiError('');
    setModal('add');
  };

  const handleCreate = async () => {
    if (!current.nom || !current.email || !current.password) return;
    if (current.password.length < 6) {
      setApiError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      const { data } = await adminAPI.createAdmin(current);
      setAdmins(prev => [data, ...prev]);
      setModal(null);
      toast.success('Administrateur créé avec succès');
    } catch (e) {
      setApiError(e.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await adminAPI.toggleAdmin(id);
      setAdmins(prev => prev.map(a => a._id === id ? data : a));
      toast.success(data.actif ? 'Compte activé' : 'Compte désactivé');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const openPasswordModal = (admin) => {
    setSelectedAdmin(admin);
    setPasswordData({ password: '', confirm: '' });
    setApiError('');
    setModal('password');
  };

  const handleResetPassword = async () => {
    if (!passwordData.password || passwordData.password.length < 6) {
      setApiError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (passwordData.password !== passwordData.confirm) {
      setApiError('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    setApiError('');
    try {
      await adminAPI.resetPassword(selectedAdmin._id, { password: passwordData.password });
      setModal(null);
      toast.success('Mot de passe réinitialisé');
    } catch (e) {
      setApiError(e.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const openRoleModal = (admin) => {
    setSelectedAdmin(admin);
    setCurrent({ role: admin.role });
    setApiError('');
    setModal('role');
  };

  const handleChangeRole = async () => {
    setSaving(true);
    setApiError('');
    try {
      const { data } = await adminAPI.changeRole(selectedAdmin._id, { role: current.role });
      setAdmins(prev => prev.map(a => a._id === selectedAdmin._id ? data : a));
      setModal(null);
      toast.success('Rôle modifié avec succès');
    } catch (e) {
      setApiError(e.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const pwdStrength = getPasswordStrength(
    modal === 'add' ? current.password : passwordData.password
  );
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
  const strengthClass  = ['', 'active-weak', 'active-weak', 'active-medium', 'active-strong'];

  // ── Render ──

  if (loading) return <div className="admin-dashboard"><Spinner /></div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Gestion des Administrateurs</h1>
          <p className="admin-date">Contrôle Super Admin — {totalAdmins} compte{totalAdmins !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-icon" onClick={fetchAdmins} title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <UserPlus size={16} /> Nouvel Admin
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="gestion-kpis">
        <div className="gestion-kpi-card">
          <div className="gestion-kpi-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
            <Users size={24} />
          </div>
          <div className="gestion-kpi-info">
            <span className="gestion-kpi-value">{totalAdmins}</span>
            <span className="gestion-kpi-label">Total Admins</span>
          </div>
        </div>
        <div className="gestion-kpi-card">
          <div className="gestion-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="gestion-kpi-info">
            <span className="gestion-kpi-value">{activeAdmins}</span>
            <span className="gestion-kpi-label">Admins Actifs</span>
          </div>
        </div>
        <div className="gestion-kpi-card">
          <div className="gestion-kpi-icon" style={{ background: 'rgba(184,146,42,0.12)', color: 'var(--gold)' }}>
            <Crown size={24} />
          </div>
          <div className="gestion-kpi-info">
            <span className="gestion-kpi-value">{superAdmins}</span>
            <span className="gestion-kpi-label">Super Admins</span>
          </div>
        </div>
        <div className="gestion-kpi-card">
          <div className="gestion-kpi-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
            <Calendar size={24} />
          </div>
          <div className="gestion-kpi-info">
            <span className="gestion-kpi-value" style={{ fontSize: '0.95rem' }}>
              {recentAdmin ? `${recentAdmin.prenom} ${recentAdmin.nom}` : '—'}
            </span>
            <span className="gestion-kpi-label">Dernier Créé</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="livres-toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Rechercher un administrateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="dash-card gestion-table-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Administrateur</th>
                <th>E-mail</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const isSelf = a._id === currentAdmin?._id;
                const isSuper = a.role === 'super_admin';
                return (
                  <tr key={a._id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td className="td-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`gestion-avatar ${isSuper ? 'gestion-avatar-super' : 'gestion-avatar-admin'}`}>
                          {(a.prenom?.[0] || '').toUpperCase()}{(a.nom?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {a.prenom} {a.nom}
                            {isSelf && <span className="self-badge">Vous</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--txt2)' }}>{a.email}</td>
                    <td>
                      <span className={`role-tag ${isSuper ? 'role-tag-super' : 'role-tag-admin'}`}>
                        {isSuper ? <><Shield size={10} /> Super Admin</> : <><ShieldCheck size={10} /> Admin</>}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${a.actif ? 'badge-actif' : 'badge-retard'}`}>
                        {a.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <span className="gestion-date">
                        <Calendar size={12} />
                        {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <span className="gestion-date">
                        {a.lastLogin
                          ? new Date(a.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span style={{ color: 'var(--txt3)', fontStyle: 'italic' }}>Jamais</span>
                        }
                      </span>
                    </td>
                    <td>
                      {isSelf ? (
                        <span style={{ color: 'var(--txt3)', fontSize: '0.75rem' }}>—</span>
                      ) : (
                        <div className="gestion-actions">
                          <button
                            className="gestion-action-btn ga-edit"
                            onClick={() => openRoleModal(a)}
                            data-tip="Changer le rôle"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="gestion-action-btn ga-key"
                            onClick={() => openPasswordModal(a)}
                            data-tip="Réinitialiser MDP"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            className={`gestion-action-btn ${a.actif ? 'ga-toggle-off' : 'ga-toggle-on'}`}
                            onClick={() => handleToggle(a._id)}
                            data-tip={a.actif ? 'Désactiver' : 'Activer'}
                          >
                            {a.actif ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="td-empty">
                    <Shield size={24} />
                    <br />Aucun administrateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Créer Admin ─── */}
      {modal === 'add' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvel Administrateur</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} /> {apiError}
                </div>
              )}

              <div className="form-field">
                <label>Rôle <span className="required">*</span></label>
                <select
                  value={current.role}
                  onChange={e => setCurrent({ ...current, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Administrateur</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Prénom <span className="required">*</span></label>
                  <input
                    type="text"
                    value={current.prenom}
                    onChange={e => setCurrent({ ...current, prenom: e.target.value })}
                    placeholder="Moussa"
                  />
                </div>
                <div className="form-field">
                  <label>Nom <span className="required">*</span></label>
                  <input
                    type="text"
                    value={current.nom}
                    onChange={e => setCurrent({ ...current, nom: e.target.value })}
                    placeholder="Diallo"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>E-mail <span className="required">*</span></label>
                <input
                  type="email"
                  value={current.email}
                  onChange={e => setCurrent({ ...current, email: e.target.value })}
                  placeholder="admin@esp.sn"
                />
              </div>

              <div className="form-field">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={current.tel}
                  onChange={e => setCurrent({ ...current, tel: e.target.value })}
                  placeholder="+221 77 000 00 00"
                />
              </div>

              <div className="form-field">
                <label>Mot de passe <span className="required">*</span></label>
                <input
                  type="password"
                  value={current.password}
                  onChange={e => setCurrent({ ...current, password: e.target.value })}
                  placeholder="Min. 6 caractères"
                />
                <div className="password-strength">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`password-strength-bar ${i <= pwdStrength ? strengthClass[pwdStrength] : ''}`}
                    />
                  ))}
                </div>
                {current.password && (
                  <span className="password-hint">
                    Force : {strengthLabels[pwdStrength] || 'Très faible'}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Réinitialiser MDP ─── */}
      {modal === 'password' && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Réinitialiser le mot de passe</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} /> {apiError}
                </div>
              )}

              <p style={{ color: 'var(--txt2)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Réinitialiser le mot de passe de <strong style={{ color: 'var(--txt1)' }}>
                  {selectedAdmin.prenom} {selectedAdmin.nom}
                </strong>
              </p>

              <div className="form-field">
                <label>Nouveau mot de passe <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                  placeholder="Min. 6 caractères"
                />
                <div className="password-strength">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`password-strength-bar ${i <= pwdStrength ? strengthClass[pwdStrength] : ''}`}
                    />
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Confirmer <span className="required">*</span></label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  placeholder="Répétez le mot de passe"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={saving}>
                {saving ? 'Réinitialisation...' : 'Réinitialiser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Changer Rôle ─── */}
      {modal === 'role' && selectedAdmin && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Changer le rôle</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} /> {apiError}
                </div>
              )}

              <p style={{ color: 'var(--txt2)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Modifier le rôle de <strong style={{ color: 'var(--txt1)' }}>
                  {selectedAdmin.prenom} {selectedAdmin.nom}
                </strong>
              </p>

              <div className="form-field">
                <label>Nouveau rôle <span className="required">*</span></label>
                <select
                  value={current.role}
                  onChange={e => setCurrent({ ...current, role: e.target.value })}
                >
                  <option value="admin">Administrateur</option>
                  <option value="super_admin">Super Administrateur</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleChangeRole} disabled={saving}>
                {saving ? 'Modification...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
