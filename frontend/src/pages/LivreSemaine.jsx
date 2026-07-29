import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeeklyBook } from '../hooks/useBooks';
import { useTranslation } from 'react-i18next';
import BookCover from '../components/BookCover';
import { Tag, Package, BookOpen } from 'lucide-react';
import './LivreSemaine.css';

export default function LivreSemaine() {
  const { book, loading, error } = useWeeklyBook();
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState('front');

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
            {t('livreSemaine.tag')}
          </span>
          <h1 className="anim-up d1">{t('livreSemaine.title')}</h1>
          <p className="livre-header-sub anim-up d2">
            {t('livreSemaine.sub')}
          </p>
        </div>
      </div>

      {/* ── CONTENU ──────────────────────────────────────── */}
      <div className="container" style={{ padding: '60px 32px 80px' }}>

        {/* Aucun livre sélectionné */}
        {error && (
          <div className="livre-empty anim-up">
            <BookOpen size={48} style={{ color: 'var(--gold)', marginBottom: 16 }} />
            <p>{t('livreSemaine.noBook')}</p>
            <Link to="/catalogue" className="btn btn-gold">
              {t('livreSemaine.viewCatalog')}
            </Link>
          </div>
        )}

        {/* Détail du livre */}
        {book && (
          <div className="livre-detail card anim-up">
            {/* Couverture */}
            <div className="livre-cover-wrap">
              {(() => {
                const frontCover = book.frontCoverImage || book.cover;
                const backCover = book.backCoverImage;
                const hasBackCover = !!backCover;
                const currentImage = activeImage === 'front' ? frontCover : backCover;

                return (
                  <div className="book-gallery" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    <div className="book-gallery-main" style={{ position: 'relative' }}>
                      {currentImage ? (
                        <img src={currentImage} alt={book.title} style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 'var(--r-lg)', boxShadow: '16px 16px 48px rgba(0,0,0,0.4), 0 0 0 1px var(--border)' }} />
                      ) : (
                        <BookCover
                          title={book.title}
                          author={book.author}
                          coverUrl={book.cover}
                          size="lg"
                          style={{ width: '100%', height: '400px', borderRadius: 'var(--r-lg)', boxShadow: '16px 16px 48px rgba(0,0,0,0.4)' }}
                        />
                      )}
                      {/* Badge flottant */}
                      <div className="livre-cover-badge">
                        <span>⭐</span> {t('livreSemaine.recommended')}
                      </div>
                    </div>
                    
                    {hasBackCover && (
                      <div className="book-gallery-thumbnails" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button 
                          className={`thumbnail-btn ${activeImage === 'front' ? 'active' : ''}`}
                          onClick={() => setActiveImage('front')}
                          style={{ width: '60px', height: '80px', padding: 0, border: activeImage === 'front' ? '2px solid var(--gold)' : '2px solid transparent', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'transparent' }}
                        >
                          <img src={frontCover} alt={t('livreSemaine.frontCover')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                        <button 
                          className={`thumbnail-btn ${activeImage === 'back' ? 'active' : ''}`}
                          onClick={() => setActiveImage('back')}
                          style={{ width: '60px', height: '80px', padding: 0, border: activeImage === 'back' ? '2px solid var(--gold)' : '2px solid transparent', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'transparent' }}
                        >
                          <img src={backCover} alt={t('livreSemaine.backCover')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Informations */}
            <div className="livre-info">
              <span className="badge badge-gold">{book.category}</span>

              <h2 className="livre-title">{book.title}</h2>
              <p className="livre-author">{t('livreSemaine.by', { author: book.author })}</p>

              <div className="gold-line" style={{ margin: '20px 0' }} />

              <div className="livre-desc-block">
                <strong className="livre-desc-label">{t('livreSemaine.summary')}</strong>
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
                      ? t('livreSemaine.stock', { count: book.stock })
                      : t('livreSemaine.noStock')}
                  </span>
                </div>
              </div>

              <div className="livre-actions">
                {book.stock > 0
                  ? <Link to="/emprunts" state={{ bookId: book._id, bookTitle: book.title }} className="btn btn-gold">{t('livreSemaine.borrowBtn')}</Link>
                  : <button className="btn btn-glass" disabled>{t('livreSemaine.outOfStockBtn')}</button>
                }
                <Link to="/catalogue" className="btn btn-glass">{t('common.viewCatalog')}</Link>
              </div>

              {/* Citation islamique */}
              <div className="livre-citation">
                <p className="livre-citation-arabic">
                  إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ
                </p>
                {t('common.citation_trans') && (
                  <p className="livre-citation-trans" style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--txt2)', margin: '6px 0', lineHeight: 1.4 }}>
                    {t('common.citation_trans')}
                  </p>
                )}
                <p className="livre-citation-src">{t('common.citation_ref')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}