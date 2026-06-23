import { useState } from 'react';
import { useLoans } from '../../hooks/useLoans';
import { useBooks } from '../../hooks/useBooks';
import { useUsers } from '../../hooks/useUsers';
import { XCircle, CheckCircle, Pencil, Clock, Search, Plus, BookOpen } from 'lucide-react';
import './AdminEmprunts.css';

const STATUS_LABELS = { en_attente: 'En attente', actif: 'Actif', retard: 'En retard', rendu: 'Rendu' };
const STATUS_CLASS  = { en_attente: 'badge-warn', actif: 'badge-actif', retard: 'badge-retard', rendu: 'badge-rendu' };
const EMPTY_EMP     = { member: '', book: '', dueDate: '', status: 'actif', notes: '' };

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

export default function AdminEmprunts() {
  const { loans, loading, error, createLoan, markReturned, updateLoan } = useLoans();
  const { books } = useBooks();
  const { users } = useUsers();

  const [filter, setFilter]   = useState('tous');
  const [modal, setModal]     = useState(null);
  const [current, setCurrent] = useState(EMPTY_EMP);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const filtered = loans.filter((l) => filter === 'tous' || l.status === filter);

  const counts = {
    tous:       loans.length,
    en_attente: loans.filter((l) => l.status === 'en_attente').length,
    actif:      loans.filter((l) => l.status === 'actif').length,
    retard:     loans.filter((l) => l.status === 'retard').length,
    rendu:      loans.filter((l) => l.status === 'rendu').length,
  };

  const openAdd  = () => { setCurrent(EMPTY_EMP); setApiError(''); setModal('add'); };
  const openEdit = (l) => {
    setCurrent({
      ...l,
      member:  l.member?._id  || l.member,
      book:    l.book?._id    || l.book,
      dueDate: l.dueDate ? new Date(l.dueDate).toISOString().split('T')[0] : '',
    });
    setApiError('');
    setModal('edit');
  };

  const handleReturn = async (id) => {
    try { await markReturned(id); } catch (e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleValidate = async (id) => {
    try { await updateLoan(id, { status: 'actif' }); }
    catch (e) { alert(e.response?.data?.message || 'Erreur validation'); }
  };

  const save = async () => {
    if (!current.member || !current.book || !current.dueDate) return;
    setSaving(true);
    setApiError('');
    try {
      if (modal === 'add') {
        await createLoan(current);
      } else {
        await updateLoan(current._id, current);
      }
      setModal(null);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-emprunts"><Spinner /></div>;
  if (error)   return (
    <div className="admin-emprunts">
      <div className="dash-error-state">
        <div className="dash-error-card">
          <XCircle size={32} color="#ef4444" />
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-emprunts">
      <div className="admin-page-header">
        <div>
          <h1>Gestion des emprunts</h1>
          <p className="admin-date">{loans.length} emprunts enregistrés</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Enregistrer emprunt
        </button>
      </div>

      {/* Onglets filtre */}
      <div className="emp-tabs">
        {[
          { key: 'tous',       label: 'Tous'       },
          { key: 'en_attente', label: 'En attente' },
          { key: 'actif',      label: 'Actifs'     },
          { key: 'retard',     label: 'En retard'  },
          { key: 'rendu',      label: 'Rendus'     },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`emp-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="emp-tab-count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="dash-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Membre</th><th>Livre</th>
                <th>Emprunté le</th><th>Retour prévu</th>
                <th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan, i) => (
                <tr key={loan._id} className={loan.status === 'retard' ? 'row-alert' : ''} style={{ animationDelay: `${i * 0.05}s` }}>
                  <td className="td-name">{loan.member?.prenom} {loan.member?.nom}</td>
                  <td className="td-book">{loan.book?.title}</td>
                  <td>{loan.borrowDate ? new Date(loan.borrowDate).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className={loan.status === 'retard' ? 'td-overdue' : ''}>
                    {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td><span className={`badge ${STATUS_CLASS[loan.status]}`}>{STATUS_LABELS[loan.status]}</span></td>
                  <td>
                    <div className="row-actions">
                      {loan.status === 'en_attente' && (
                        <button className="row-btn rb-gold" onClick={() => handleValidate(loan._id)}>
                          <CheckCircle size={13} /> Valider
                        </button>
                      )}
                      {loan.status !== 'rendu' && loan.status !== 'en_attente' && (
                        <button className="row-btn rb-green" onClick={() => handleReturn(loan._id)}>
                          <CheckCircle size={13} /> Rendu
                        </button>
                      )}
                      <button className="row-btn row-btn-edit" onClick={() => openEdit(loan)}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="td-empty">
                    <BookOpen size={20} />
                    <br />Aucun emprunt trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Enregistrer un emprunt' : "Modifier l'emprunt"}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} />
                  {apiError}
                </div>
              )}
              <div className="form-field">
                <label>Membre <span className="required">*</span></label>
                <select value={current.member} onChange={(e) => setCurrent({ ...current, member: e.target.value })}>
                  <option value="">— Sélectionner un membre —</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.prenom} {u.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Livre <span className="required">*</span></label>
                <select value={current.book} onChange={(e) => setCurrent({ ...current, book: e.target.value })}>
                  <option value="">— Sélectionner un livre —</option>
                  {books.filter((b) => b.stock > 0 || modal === 'edit').map((b) => (
                    <option key={b._id} value={b._id}>{b.title} ({b.stock} dispo.)</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Date de retour prévue <span className="required">*</span></label>
                  <input type="date" value={current.dueDate} onChange={(e) => setCurrent({ ...current, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-field">
                  <label>Statut</label>
                  <select value={current.status} onChange={(e) => setCurrent({ ...current, status: e.target.value })}>
                    <option value="actif">Actif</option>
                    <option value="retard">En retard</option>
                    <option value="rendu">Rendu</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Notes</label>
                <textarea rows={2} value={current.notes || ''} onChange={(e) => setCurrent({ ...current, notes: e.target.value })} placeholder="Remarques éventuelles..." />
              </div>
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