import { useState } from 'react';
import { useBooks } from '../../hooks/useBooks';
import { XCircle, Pencil, Trash2, Plus, Search, BookOpen, Sparkles, Image as ImageIcon } from 'lucide-react';
import { aiAPI } from '../../services/api';
import './AdminLivres.css';

const CATS  = ['Aqida', 'Tawhid', 'Fiqh', 'Sira', 'Hadith', 'Tazkiyya', 'Autre'];
const EMPTY = { title: '', author: '', category: 'Aqida', stock: 1, description: '', frontCoverImage: '', backCoverImage: '', aiExtractedText: '' };

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

export default function AdminLivres() {
  const { books, loading, error, createBook, updateBook, deleteBook } = useBooks();
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [current, setCurrent]   = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = ()  => { setCurrent(EMPTY); setFrontFile(null); setBackFile(null); setApiError(''); setModal('add'); };
  const openEdit = (b) => { setCurrent({ ...b }); setFrontFile(null); setBackFile(null); setApiError(''); setModal('edit'); };
  const openDel  = (id) => { setDeleteId(id); setModal('delete'); };

  const handleAI = async () => {
    if (!frontFile && !backFile) return alert("Veuillez sélectionner au moins une image (page de garde ou arrière).");
    setExtracting(true);
    setApiError('');
    try {
      const formData = new FormData();
      if (frontFile) formData.append('frontCover', frontFile);
      if (backFile) formData.append('backCover', backFile);
      
      const res = await aiAPI.extractCovers(formData);
      setCurrent(prev => ({
        ...prev,
        title: res.data.title || prev.title,
        author: res.data.author || prev.author,
        frontCoverImage: res.data.frontCoverUrl || prev.frontCoverImage,
        backCoverImage: res.data.backCoverUrl || prev.backCoverImage,
        aiExtractedText: res.data.extractedText || prev.aiExtractedText
      }));
      setFrontFile(null); // Clear files so we don't re-upload
      setBackFile(null);
    } catch (err) {
      setApiError(err.response?.data?.message || "Erreur lors de l'extraction IA");
    } finally {
      setExtracting(false);
    }
  };

  const saveBook = async () => {
    if (!current.title || !current.author) return;
    setSaving(true);
    setApiError('');
    try {
      if (modal === 'add') {
        await createBook(current);
      } else {
        await updateBook(current._id, current);
      }
      setModal(null);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteBook(deleteId);
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="admin-livres"><Spinner /></div>;
  if (error)   return (
    <div className="admin-livres">
      <div className="dash-error-state">
        <div className="dash-error-card">
          <XCircle size={32} color="#ef4444" />
          <p>{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-livres">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Gestion des livres</h1>
          <p className="admin-date">{books.length} ouvrages au total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Ajouter un livre
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="livres-toolbar">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher un livre..."
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
                <th>#</th><th>Titre</th><th>Auteur</th>
                <th>Catégorie</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book, i) => (
                <tr key={book._id} style={{ animationDelay: `${i * 0.05}s` }}>
                  <td style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td className="td-name">{book.title}</td>
                  <td className="td-book">{book.author}</td>
                  <td><span className="badge badge-actif">{book.category}</span></td>
                  <td>
                    <span className={`badge ${book.stock === 0 ? 'badge-retard' : book.stock <= 1 ? 'badge-warn' : 'badge-actif'}`}>
                      {book.stock === 0 ? 'Épuisé' : `${book.stock} ex.`}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="row-btn row-btn-edit" onClick={() => openEdit(book)}>
                        <Pencil size={13} /> Modifier
                      </button>
                      <button className="row-btn row-btn-del" onClick={() => openDel(book._id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="td-empty">
                    <BookOpen size={20} style={{ opacity: 0.4, marginBottom: 4 }} />
                    <br />Aucun résultat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter / Modifier */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Ajouter un livre' : 'Modifier le livre'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {apiError && (
                <div className="form-error-banner">
                  <XCircle size={14} />
                  {apiError}
                </div>
              )}
              
              {/* IA Extraction Section */}
              <div className="ai-extraction-section" style={{ background: 'var(--bg2)', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--border)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', marginBottom: '10px' }}>
                  <Sparkles size={16} color="var(--gold)" />
                  Générer le contenu via IA (Photos)
                </h3>
                <div className="form-row">
                  <div className="form-field">
                    <label style={{ fontSize: '0.8rem' }}><ImageIcon size={14} style={{display:'inline', verticalAlign:'middle'}}/> Page de garde (Avant)</label>
                    <input type="file" accept="image/*" onChange={(e) => setFrontFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                  </div>
                  <div className="form-field">
                    <label style={{ fontSize: '0.8rem' }}><ImageIcon size={14} style={{display:'inline', verticalAlign:'middle'}}/> Quatrième de couverture (Arrière)</label>
                    <input type="file" accept="image/*" onChange={(e) => setBackFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                  </div>
                </div>
                <button type="button" className="btn btn-gold" onClick={handleAI} disabled={extracting || (!frontFile && !backFile)} style={{ width: '100%', marginTop: '5px' }}>
                  {extracting ? 'Analyse de l\'image en cours...' : 'Extraire le texte & Auto-remplir'}
                </button>
              </div>

              <div className="form-field">
                <label>Titre <span className="required">*</span></label>
                <input type="text" value={current.title} onChange={(e) => setCurrent({ ...current, title: e.target.value })} placeholder="Titre du livre" />
              </div>
              <div className="form-field">
                <label>Auteur <span className="required">*</span></label>
                <input type="text" value={current.author} onChange={(e) => setCurrent({ ...current, author: e.target.value })} placeholder="Nom de l'auteur" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Catégorie</label>
                  <select value={current.category} onChange={(e) => setCurrent({ ...current, category: e.target.value })}>
                    {CATS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Stock</label>
                  <input type="number" min="0" value={current.stock} onChange={(e) => setCurrent({ ...current, stock: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="form-field">
                <label>Description (Optionnelle)</label>
                <textarea rows={2} value={current.description || ''} onChange={(e) => setCurrent({ ...current, description: e.target.value })} placeholder="Brève description..." />
              </div>
              <div className="form-field">
                <label>Texte intégral extrait par l'IA (Affiché en mode Lecture)</label>
                <textarea rows={5} value={current.aiExtractedText || ''} onChange={(e) => setCurrent({ ...current, aiExtractedText: e.target.value })} placeholder="Texte enrichi généré par l'IA..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveBook} disabled={saving}>
                {saving ? 'Enregistrement...' : modal === 'add' ? 'Ajouter' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {modal === 'delete' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer la suppression</h2>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
                Cette action est irréversible. Le livre sera définitivement supprimé de la bibliothèque.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Annuler</button>
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