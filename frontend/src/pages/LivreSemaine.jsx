import { Link } from 'react-router-dom';
import { useWeeklyBook } from '../hooks/useBooks';
import BookCover from '../components/BookCover';
import { Tag, Package, BookOpen } from 'lucide-react';
import './LivreSemaine.css';

export default function LivreSemaine() {
  const { book, loading, error } = useWeeklyBook();

  if (loading) {
    return (
      <div className="livre-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="livre-semaine-page" style={{ marginTop: 'var(--nav-h)' }}>

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="livre-header">
        <div className="livre-header-orb livre-header-orb-1" />
        <div className="livre-header-orb livre-header-orb-2" />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="tag tag-gold anim-up">
            <BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Cette semaine
          </span>
          <h1 className="anim-up d1">Livre de la semaine</h1>
          <p className="livre-header-sub anim-up d2">
            Sélectionné par le Comité Culturel Islamique
          </p>
        </div>
      </div>

      {/* ── CONTENU ──────────────────────────────────────── */}
      <div className="container" style={{ padding: '60px 32px 80px' }}>

        {/* Aucun livre sélectionné */}
        {error && (
          <div className="livre-empty anim-up">
            <BookOpen size={48} style={{ color: 'var(--gold)', marginBottom: 16 }} />
            <p>Aucun livre de la semaine n'a été sélectionné pour le moment.</p>
            <Link to="/catalogue" className="btn btn-gold">
              Voir le catalogue →
            </Link>
          </div>
        )}

        {/* Détail du livre */}
        {book && (
          <div className="livre-detail card anim-up">
            {/* Couverture */}
            <div className="livre-cover-wrap">
              <BookCover
                title={book.title}
                author={book.author}
                coverUrl={book.cover}
                size="lg"
                style={{ width: '100%', height: '100%', borderRadius: 12 }}
              />
              {/* Badge flottant */}
              <div className="livre-cover-badge">
                <span>⭐</span> Recommandé
              </div>
            </div>

            {/* Informations */}
            <div className="livre-info">
              <span className="badge badge-gold">{book.category}</span>

              <h2 className="livre-title">{book.title}</h2>
              <p className="livre-author">— Par {book.author}</p>

              <div className="gold-line" style={{ margin: '20px 0' }} />

              <div className="livre-desc-block">
                <strong className="livre-desc-label">Résumé :</strong>
                <p className="livre-desc">
                  {book.description || 'Un ouvrage incontournable de notre collection islamique.'}
                </p>
              </div>

              <div className="livre-meta">
                <div className="livre-meta-item">
                  <span className="livre-meta-icon"><Tag size={15} /></span>
                  <span>{book.category}</span>
                </div>
                <div className="livre-meta-item">
                  <span className="livre-meta-icon"><Package size={15} /></span>
                  <span>
                    {book.stock > 0
                      ? `${book.stock} exemplaire(s) disponible(s)`
                      : 'Indisponible en stock'}
                  </span>
                </div>
              </div>

              <div className="livre-actions">
                {book.stock > 0
                  ? <Link to="/emprunts" className="btn btn-gold">Emprunter ce livre →</Link>
                  : <button className="btn btn-glass" disabled>Rupture de stock</button>
                }
                <Link to="/catalogue" className="btn btn-glass">Voir le catalogue</Link>
              </div>

              {/* Citation islamique */}
              <div className="livre-citation">
                <p className="livre-citation-arabic">
                  إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ
                </p>
                <p className="livre-citation-trans" style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--txt2)', margin: '6px 0', lineHeight: 1.4 }}>
                  « Parmi les serviteurs d'Allah, seuls les savants Le craignent vraiment. »
                </p>
                <p className="livre-citation-src">Sourate Fâtir : 28</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}