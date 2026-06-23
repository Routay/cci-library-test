import { useState } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';
import { XCircle, Pencil, UserPlus, Search, User } from 'lucide-react';
import './AdminMembres.css';

const EMPTY = { nom: '', prenom: '', email: '', tel: '', actif: true, role: 'membre', password: '' };

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

export default function AdminMembres() {
  const { users, loading, error, createUser, updateUser, toggleActive } = useUsers();
  const { admin } = useAuth();
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [current, setCurrent]   = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState('');

  const filtered = users.filter((u) =>
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setCurrent(EMPTY); setApiError(''); setModal('add'); };
  const openEdit = (u) => { setCurrent({ ...u }); setApiError(''); setModal('edit'); };

  const save = async () => {
    if (!current.nom || !current.email) return;
    setSaving(true);
    setApiError('');
    try {
      if (modal === 'add') {
        await createUser(current);
      } else {
        await updateUser(current._id, current);
      }
      setModal(null);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try { await toggleActive(id); }
    catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <div style={{ padding: 48 }}><Spinner /></div>;
  if (error)   return (
    <div style={{ padding: 48, display: 'flex', alignItems: 'center', gap: 8, color: '#F87171' }}>
      <XCircle size={18} /> {error}
    </div>
  );

  return (
    <div className="admin-membres">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Membres</h1>
          <p className="admin-date">{users.length} membre{users.length !== 1 ? 's' : ''} inscrits</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <UserPlus size={16} /> Ajouter membre
        </button>
      </div>

      {/* Toolbar */}
      <div className="livres-toolbar">
        <div className="search-bar" style={{ maxWidth: 380 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div className="dash-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom complet</th>
                <th>E-mail</th>
                <th>Téléphone</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td className="td-name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="member-avatar-lg">
                        {(u.prenom?.[0] || '').toUpperCase()}{(u.nom?.[0] || '').toUpperCase()}
                      </div>
                      {u.prenom} {u.nom}
                    </div>
                  </td>
                  <td style={{ color: 'var(--txt2)' }}>{u.email}</td>
                  <td style={{ color: 'var(--txt2)' }}>{u.telephone || u.tel || '—'}</td>
                  <td>
                    <span className={`badge ${u.actif ? 'badge-actif' : 'badge-rendu'}`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn row-btn-edit" onClick={() => openEdit(u)}>
                        <Pencil size={13} /> Modifier
                      </button>
                      <button
                        className={`row-btn-toggle ${u.actif ? 'rb-red' : 'rb-green'}`}
                        onClick={() => handleToggle(u._id)}
                      >
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="td-empty">
                    <User size={20} />
                    <br />Aucun membre trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter / Modifier */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Ajouter un membre' : 'Modifier le membre'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} />
                  {apiError}
                </div>
              )}

              {/* Rôle — super_admin uniquement, à l'ajout */}
              {admin?.role === 'super_admin' && modal === 'add' && (
                <div className="form-field">
                  <label>Rôle <span className="required">*</span></label>
                  <select
                    value={current.role || 'membre'}
                    onChange={(e) => setCurrent({ ...current, role: e.target.value, password: '' })}
                  >
                    <option value="membre">Membre</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label>Prénom <span className="required">*</span></label>
                  <input
                    type="text"
                    value={current.prenom || ''}
                    onChange={(e) => setCurrent({ ...current, prenom: e.target.value })}
                    placeholder="Moussa"
                  />
                </div>
                <div className="form-field">
                  <label>Nom <span className="required">*</span></label>
                  <input
                    type="text"
                    value={current.nom || ''}
                    onChange={(e) => setCurrent({ ...current, nom: e.target.value })}
                    placeholder="Diallo"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>E-mail <span className="required">*</span></label>
                <input
                  type="email"
                  value={current.email || ''}
                  onChange={(e) => setCurrent({ ...current, email: e.target.value })}
                  placeholder="moussa@esp.sn"
                />
              </div>

              <div className="form-field">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={current.tel || current.telephone || ''}
                  onChange={(e) => setCurrent({ ...current, tel: e.target.value, telephone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                />
              </div>

              {/* Mot de passe (sous-admin uniquement) */}
              {admin?.role === 'super_admin' && modal === 'add' && current.role === 'admin' && (
                <div className="form-field">
                  <label>Mot de passe <span className="required">*</span></label>
                  <input
                    type="password"
                    value={current.password || ''}
                    onChange={(e) => setCurrent({ ...current, password: e.target.value })}
                    placeholder="Mot de passe du sous-admin"
                  />
                </div>
              )}

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={current.actif ?? true}
                  onChange={(e) => setCurrent({ ...current, actif: e.target.checked })}
                />
                Compte actif
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}