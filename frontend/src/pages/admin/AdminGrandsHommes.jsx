import { useState, useEffect } from 'react';
import { grandsHommesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff, X,
  Save, RefreshCw, GripVertical, Image, Tag, Calendar
} from 'lucide-react';
import './AdminDashboard.css';
import './AdminLivres.css';
import './AdminGrandsHommes.css';

const EMPTY_FORM = {
  name: '', title: '', dates: '', description: '',
  image: '', tags: '', ordre: 0, actif: true,
};

export default function AdminGrandsHommes() {
  const [hommes,  setHommes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [editing, setEditing] = useState(null);   // null = liste, 'new' = créer, id = modifier
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    grandsHommesAPI.getAllAdmin()
      .then(({ data }) => setHommes(data.hommes || []))
      .catch(err => toast.error(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Ouvrir le formulaire ──
  const openNew = () => {
    setForm({ ...EMPTY_FORM, ordre: hommes.length + 1 });
    setEditing('new');
  };

  const openEdit = (homme) => {
    setForm({
      name: homme.name || '',
      title: homme.title || '',
      dates: homme.dates || '',
      description: homme.description || '',
      image: homme.image || '',
      tags: (homme.tags || []).join(', '),
      ordre: homme.ordre || 0,
      actif: homme.actif !== false,
    });
    setEditing(homme._id);
  };

  const cancelEdit = () => { setEditing(null); setForm(EMPTY_FORM); };

  // ── Sauvegarder ──
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim() || !form.description.trim()) {
      toast.error('Nom, titre et description sont obligatoires');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      ordre: Number(form.ordre) || 0,
    };

    try {
      if (editing === 'new') {
        await grandsHommesAPI.create(payload);
        toast.success('Personnalité ajoutée avec succès');
      } else {
        await grandsHommesAPI.update(editing, payload);
        toast.success('Personnalité modifiée avec succès');
      }
      cancelEdit();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle actif ──
  const handleToggle = async (id) => {
    try {
      await grandsHommesAPI.toggle(id);
      toast.success('Visibilité modifiée');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  // ── Supprimer ──
  const handleDelete = (id, name) => {
    setDeleting({ id, name });
  };

  const confirmDelete = async () => {
    try {
      await grandsHommesAPI.delete(deleting.id);
      toast.success('Personnalité supprimée');
      fetchAll();
      setDeleting(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // ── Filtrage ──
  const filtered = hommes.filter(h => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.title.toLowerCase().includes(q) ||
      h.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dash-spinner-wrap"><div className="dash-spinner" /></div>
      </div>
    );
  }

  // ── Formulaire édition/création ──
  if (editing !== null) {
    return (
      <div className="admin-dashboard">
        <div className="admin-page-header">
          <div>
            <h1>{editing === 'new' ? 'Ajouter une personnalité' : 'Modifier la personnalité'}</h1>
            <p className="admin-date">Grands Hommes de l'Islam</p>
          </div>
          <button className="btn btn-outline" onClick={cancelEdit}>
            <X size={16} /> Annuler
          </button>
        </div>

        <form className="gh-admin-form dash-card" onSubmit={handleSave}>
          <div className="gh-form-grid">
            {/* Nom */}
            <div className="gh-form-field">
              <label>Nom <span className="required">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Al-Ghazâlî"
                required
              />
            </div>

            {/* Titre */}
            <div className="gh-form-field">
              <label>Titre / Surnom <span className="required">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Hujjat al-Islam"
                required
              />
            </div>

            {/* Dates */}
            <div className="gh-form-field">
              <label><Calendar size={14} /> Dates</label>
              <input
                type="text"
                value={form.dates}
                onChange={e => setForm({ ...form, dates: e.target.value })}
                placeholder="Ex: 1058 – 1111"
              />
            </div>

            {/* Ordre */}
            <div className="gh-form-field">
              <label><GripVertical size={14} /> Ordre d'affichage</label>
              <input
                type="number"
                value={form.ordre}
                onChange={e => setForm({ ...form, ordre: e.target.value })}
                min="0"
              />
            </div>

            {/* Image URL */}
            <div className="gh-form-field gh-form-full">
              <label><Image size={14} /> URL de l'image</label>
              <input
                type="url"
                value={form.image}
                onChange={e => setForm({ ...form, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
              {form.image && (
                <div className="gh-form-preview">
                  <img src={form.image} alt="Aperçu" onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="gh-form-field gh-form-full">
              <label><Tag size={14} /> Tags (séparés par des virgules)</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="Théologie, Soufisme, Philosophie"
              />
            </div>

            {/* Description */}
            <div className="gh-form-field gh-form-full">
              <label>Description <span className="required">*</span></label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Biographie détaillée de la personnalité…"
                rows={5}
                required
              />
            </div>

            {/* Actif */}
            <div className="gh-form-field gh-form-check">
              <label className="gh-checkbox-label">
                <input
                  type="checkbox"
                  checked={form.actif}
                  onChange={e => setForm({ ...form, actif: e.target.checked })}
                />
                <span>Visible publiquement</span>
              </label>
            </div>
          </div>

          <div className="gh-form-actions">
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Liste principale ──
  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Grands Hommes</h1>
          <p className="admin-date">Gestion des biographies — {hommes.length} entrée{hommes.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-icon" onClick={fetchAll} title="Rafraîchir">
            <RefreshCw size={18} />
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="livres-toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher un nom, titre, tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="results-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="dash-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Image</th>
                <th>Nom</th>
                <th>Titre</th>
                <th>Dates</th>
                <th>Tags</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr key={h._id} style={{ animationDelay: `${i * 0.04}s`, opacity: h.actif ? 1 : 0.55 }}>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{h.ordre || i + 1}</td>
                  <td>
                    {h.image ? (
                      <img
                        src={h.image}
                        alt={h.name}
                        className="gh-admin-thumb"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="gh-admin-thumb-placeholder">—</div>
                    )}
                  </td>
                  <td className="td-name" style={{ fontWeight: 600 }}>{h.name}</td>
                  <td style={{ color: 'var(--gold-l)', fontStyle: 'italic', fontSize: '0.85rem' }}>{h.title}</td>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{h.dates || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(h.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${h.actif ? 'badge-actif' : 'badge-retard'}`}>
                      {h.actif ? 'Visible' : 'Masqué'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="row-btn row-btn-edit"
                        onClick={() => openEdit(h)}
                        title="Modifier"
                      >
                        <Edit2 size={13} /> Éditer
                      </button>
                      <button
                        className="row-btn"
                        onClick={() => handleToggle(h._id)}
                        title={h.actif ? 'Masquer' : 'Afficher'}
                      >
                        {h.actif ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        className="row-btn row-btn-del"
                        onClick={() => handleDelete(h._id, h.name)}
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="td-empty">
                    Aucune personnalité trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Suppression */}
      {deleting && (
        <div className="modal-overlay" onClick={() => setDeleting(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button className="modal-close" onClick={() => setDeleting(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
                Êtes-vous sûr de vouloir supprimer <strong>"{deleting.name}"</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleting(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
