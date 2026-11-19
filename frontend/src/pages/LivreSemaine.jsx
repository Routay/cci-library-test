import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeeklyBook } from '../hooks/useBooks';
import { useTranslation } from 'react-i18next';
import BookCover from '../components/BookCover';
import { Tag, Package, BookOpen } from 'lucide-react';
import './LivreSemaine.css';

/**
 * Hook réactif : largeur courante de la fenêtre, mise à jour au resize.
 * S'initialise immédiatement avec window.innerWidth (pas de flash de layout).
 */
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

export default function LivreSemaine() {
  const { book, loading, error } = useWeeklyBook();
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState('front');
  const windowWidth = useWindowWidth();

  /*
   * ── Calcul de la taille du livre selon le breakpoint ────────────
   * null = desktop → le CSS grid prend le contrôle de la taille.
   * Sur mobile, on impose directement la largeur via inline styles
   * pour garantir le centrage et la taille, indépendamment du cache CSS.
   *
   * Tailles calculées pour être ~55–60% de la zone de contenu utile
   * (viewport − padding container − padding card) = visuellement généreux.
   */
  const bookPx =
    windowWidth <= 360 ? 165 :   /* ~55 % de 300px de contenu utile */
    windowWidth <= 480 ? 200 :   /* ~55 % de 364px                 */
    windowWidth <= 600 ? 240 :   /* ~55 % de 436px                 */
    windowWidth <= 768 ? 270 :   /* ~55 % de 492px                 */
    null;                        /* desktop : CSS grid seul        */

  /*
   * ── Styles inline appliqués à CHAQUE niveau de la chaîne ────────
   * Garantit que width:100% sur chaque enfant respecte bien le max du parent.
   * Invulnérable au cache du serveur de dev (priorité inline > feuille CSS).
   */
  const frameStyle = bookPx != null
    ? { width: `${bookPx}px`, maxWidth: `${bookPx}px`, flexShrink: 0 }
    : {};

  const colStyle = bookPx != null
    ? {
        width  : `${bookPx}px`,
        maxWidth: `${bookPx}px`,
        marginLeft : 'auto',
        marginRight: 'auto',
        display    : 'flex',
        flexDirection : 'column',
        alignItems    : 'center',
      }
    : {};

  const imgStyle = bookPx != null
    ? { width: `${bookPx}px`, maxWidth: `${bookPx}px` }
    : {};

  if (loading) {
    return (
      <div className="livre-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="livre-semaine-page" style={{ marginTop: 'var(--nav-h)' }}>

      {/* ─────────────────────────────────────────────────────────────
          CSS injecté directement dans le DOM — filet anti-cache.
          Les !important écrasent tout CSS en cache du navigateur.
          ─────────────────────────────────────────────────────────────
          SÉPARATION HEADER / CARTE :
          Espace blanc visible entre la bande verte et la carte,
          sans aucun chevauchement. La carte reste bien en dessous.
      ───────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Header : padding-bottom modéré (fin nette de la bande verte) ── */
        .livre-header {
          padding-bottom: clamp(48px, 8vw, 96px) !important;
        }

        /* ── Container : espace blanc clair entre le vert et la carte ── */
        .livre-content-container {
          margin-top: 0 !important;
          padding-top: clamp(48px, 7vw, 80px) !important;
          padding-bottom: clamp(80px, 12vw, 160px) !important;
          background: var(--bg1) !important;
          position: relative !important;
          z-index: 2 !important;
        }

        /* ── Mobile : carte flex colonne + centrage ── */
        @media (max-width: 768px) {
          .livre-header {
            padding-bottom: clamp(36px, 7vw, 60px) !important;
          }
          .livre-content-container {
            padding-top: clamp(36px, 7vw, 56px) !important;
            padding-bottom: clamp(56px, 10vw, 96px) !important;
          }
          .livre-detail {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            /* overflow: visible — badge "Recommandé" doit rester visible */
          }
          .livre-cover-col {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }

        @media (max-width: 600px) {
          .livre-header {
            padding-bottom: clamp(28px, 6vw, 48px) !important;
          }
          .livre-content-container {
            padding-top: clamp(28px, 6vw, 48px) !important;
          }
        }

        @media (max-width: 360px) {
          .livre-header {
            padding-bottom: 24px !important;
          }
          .livre-content-container {
            padding-top: 24px !important;
          }
        }

        /* ── Typographie augmentée : anti-cache ─────────────── */
        .livre-header h1 {
          font-size: clamp(2rem, 4.5vw, 3.8rem) !important;
        }
        .livre-header-sub {
          font-size: clamp(1rem, 1.3vw + 0.4rem, 1.15rem) !important;
        }
        .livre-title {
          font-size: clamp(1.6rem, 4vw, 3rem) !important;
        }
        .livre-author {
          font-size: clamp(1.1rem, 1.5vw + 0.4rem, 1.35rem) !important;
          background: linear-gradient(180deg, #FFE135, #FFC20E, #F39200) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          font-weight: 700 !important;
        }
        .livre-desc {
          font-size: clamp(1rem, 1.2vw + 0.4rem, 1.12rem) !important;
          line-height: 1.9 !important;
        }
        .livre-cover-badge {
          font-size: clamp(0.78rem, 0.95vw + 0.3rem, 0.9rem) !important;
        }
        @media (max-width: 480px) {
          .livre-title  { font-size: clamp(1.3rem, 5.5vw, 1.7rem) !important; }
          .livre-author { font-size: clamp(0.98rem, 3.8vw, 1.15rem) !important; }
        }
            `}</style>

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
      <div className="container livre-content-container">

        {/* État vide */}
        {error && (
          <div className="livre-empty anim-up">
            <BookOpen size={48} style={{ color: 'var(--gold)', marginBottom: 16 }} />
            <p>{t('livreSemaine.noBook')}</p>
            <Link to="/catalogue" className="btn btn-gold">
              {t('livreSemaine.viewCatalog')}
            </Link>
          </div>
        )}

        {/* ── Détail du livre ───────────────────────────── */}
        {book && (
          <div className="livre-detail card anim-up">

            {/*
             * ── Colonne couverture ──────────────────────────────
             * colStyle  → contraint la colonne entière (mobile uniquement)
             * frameStyle → chaque wrapper interne hérite la même largeur
             * imgStyle  → verrouille l'image elle-même
             *
             * Sur desktop (bookPx = null) : tous les styles sont {},
             * le CSS grid + .livre-book-frame { width:100% } gère seul.
             */}
            <div className="livre-cover-col" style={colStyle}>
              <div className="livre-book-frame" style={frameStyle}>
                <div className="livre-cover-wrap" style={frameStyle}>
                  {(() => {
                    const frontCover   = book.frontCoverImage || book.cover;
                    const backCover    = book.backCoverImage;
                    const hasBackCover = !!backCover;
                    const currentImage = activeImage === 'front' ? frontCover : backCover;

                    return (
                      <div className="book-gallery" style={frameStyle}>
                        <div className="book-gallery-main" style={frameStyle}>

                          {currentImage ? (
                            <img
                              src={currentImage}
                              alt={book.title}
                              className="book-gallery-cover-img"
                              style={imgStyle}
                            />
                          ) : (
                            <BookCover
                              title={book.title}
                              author={book.author}
                              coverUrl={book.cover}
                              size="lg"
                              stage={false}
                              className="book-gallery-cover-stage"
                            />
                          )}

                          {/* Badge positionné dans .book-gallery-main (position:relative) */}
                          <div className="livre-cover-badge">
                            <span>⭐</span> {t('livreSemaine.recommended')}
                          </div>
                        </div>

                        {hasBackCover && (
                          <div className="book-gallery-thumbnails">
                            <button
                              className={`thumbnail-btn ${activeImage === 'front' ? 'active' : ''}`}
                              onClick={() => setActiveImage('front')}
                            >
                              <img src={frontCover} alt={t('livreSemaine.frontCover')} />
                            </button>
                            <button
                              className={`thumbnail-btn ${activeImage === 'back' ? 'active' : ''}`}
                              onClick={() => setActiveImage('back')}
                            >
                              <img src={backCover} alt={t('livreSemaine.backCover')} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ── Colonne informations ── */}
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
                  ? (
                    <Link
                      to="/emprunts"
                      state={{ bookId: book._id, bookTitle: book.title }}
                      className="btn btn-gold"
                    >
                      {t('livreSemaine.borrowBtn')}
                    </Link>
                  ) : (
                    <button className="btn btn-glass" disabled>
                      {t('livreSemaine.outOfStockBtn')}
                    </button>
                  )
                }
                <Link to="/catalogue" className="btn btn-glass">
                  {t('common.viewCatalog')}
                </Link>
                <Link to={`/livre/${book._id}`} className="btn btn-glass">
                  Voir les détails
                </Link>
              </div>

              {/* Citation islamique */}
              <div className="livre-citation">
                <p className="livre-citation-arabic">
                  إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ
                </p>
                {t('common.citation_trans') && (
                  <p className="livre-citation-trans">
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
