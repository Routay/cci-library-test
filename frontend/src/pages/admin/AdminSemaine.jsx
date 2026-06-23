import { useState } from 'react';
import { useWeeklyBook } from '../../hooks/useBooks';
import { useBooks } from '../../hooks/useBooks';
import BookCover from '../../components/BookCover';
import { BookOpen, CheckCircle, Star } from 'lucide-react';
import './AdminSemaine.css';

export default function AdminSemaine() {
  const { book: weeklyBook, loading, setWeeklyBook } = useWeeklyBook();
  const { books } = useBooks();
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      await setWeeklyBook(selectedId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const preview = selectedId
    ? books.find((b) => b._id === selectedId)
    : weeklyBook;

  if (loading) {
    return (
      <div className="admin-semaine">
        <div className="dash-spinner-wrap">
          <div className="dash-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-semaine">
      <div className="admin-page-header">
        <div>
          <h1>Livre de la semaine</h1>
          <p className="admin-date">Sélection visible sur le site public</p>
        </div>
      </div>

      <div className="semaine-grid">
        {/* Formulaire */}
        <div className="dash-card semaine-form-card">
          <h2>Changer la sélection</h2>

          {error && (
            <div className="form-error-banner">
              {error}
            </div>
          )}

          {/* Livre actuel */}
          {weeklyBook && (
            <div className="semaine-current">
              <p className="semaine-current-label">Livre actuel</p>
              <p className="semaine-current-title">{weeklyBook.title}</p>
              <p className="semaine-current-author">— {weeklyBook.author}</p>
            </div>
          )}

          <div className="semaine-form">
            <div className="form-field">
              <label>
                Choisir un nouveau livre <span className="required">*</span>
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">— Sélectionner un livre —</option>
                {books.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} — {b.author}
                  </option>
                ))}
              </select>
            </div>

            <button
              className={`btn ${saved ? 'btn-gold' : 'btn-primary'}`}
              onClick={handleSave}
              disabled={!selectedId || saving}
              style={{ alignSelf: 'flex-start' }}
            >
              {saving ? 'Enregistrement...' : saved ? (
                <><CheckCircle size={14} /> Enregistré !</>
              ) : 'Mettre à jour →'}
            </button>
          </div>
        </div>

        {/* Aperçu */}
        <div className="dash-card semaine-preview-card">
          <p className="semaine-preview-label">Aperçu public</p>

          <div className="semaine-preview-cover">
            {preview?.cover ? (
              <BookCover title={preview.title} author={preview.author} coverUrl={preview.cover} size="sm" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            ) : (
              <BookOpen size={40} strokeWidth={1} style={{ color: 'var(--gold)', opacity: 0.6, zIndex: 1 }} />
            )}
          </div>

          {preview ? (
            <>
              <span className="tag tag-gold semaine-preview-tag">
                <Star size={11} /> Cette semaine
              </span>
              <h3 className="semaine-preview-title">{preview.title}</h3>
              <p className="semaine-preview-author">— {preview.author}</p>
              <p className="semaine-preview-desc">{preview.description || 'Aucune description.'}</p>
            </>
          ) : (
            <p className="semaine-no-selection">Aucun livre sélectionné.</p>
          )}
        </div>
      </div>
    </div>
  );
}