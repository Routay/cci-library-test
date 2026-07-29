import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Info, Search, X, Tag, Calendar, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { grandsHommesAPI } from '../services/api';
import './GrandsHommes.css';

/* ── Placeholder coloré si pas d'image ─────────────────── */
const BG_PALETTE = [
  ['#1A2E2A','#3B6A5A','#5DCAA5'],
  ['#1A2040','#2E3A6E','#60A5FA'],
  ['#2E1A10','#5A3820','#FBBF24'],
  ['#2A1A30','#503060','#C084FC'],
  ['#2A2A1A','#4A4A28','#FCD34D'],
  ['#1A2530','#2E3F50','#38BDF8'],
];
function getPalette(str) {
  if (!str) return BG_PALETTE[0];
  return BG_PALETTE[str.charCodeAt(0) % BG_PALETTE.length];
}

/* ── Carte squelette ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="gh-card gh-skeleton">
      <div className="gh-card-img-wrapper gh-skel-img" />
      <div className="gh-card-body">
        <div className="gh-skel-line gh-skel-title" />
        <div className="gh-skel-line gh-skel-sub" />
        <div className="gh-skel-tags">
          <div className="gh-skel-tag" /><div className="gh-skel-tag" />
        </div>
        <div className="gh-skel-line" />
        <div className="gh-skel-line gh-skel-short" />
      </div>
    </div>
  );
}

/* ── Modal détail ────────────────────────────────────────── */
function DetailModal({ homme, onClose }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!homme) return null;
  const [bg1, bg2, accent] = getPalette(homme.name);
  const DESC_LIMIT = 280;
  const isLong = homme.description && homme.description.length > DESC_LIMIT;

  return (
    <div className="gh-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="gh-modal">
        {/* Header image / gradient */}
        <div
          className="gh-modal-banner"
          style={homme.image
            ? { backgroundImage: `url(${homme.image})` }
            : { background: `linear-gradient(135deg, ${bg1}, ${bg2})` }
          }
        >
          <div className="gh-modal-banner-overlay" />
          <button className="gh-modal-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
          <div className="gh-modal-banner-content">
            {homme.dates && (
              <span className="gh-modal-dates">
                <Calendar size={13} /> {homme.dates}
              </span>
            )}
            <h2 className="gh-modal-name">{homme.name}</h2>
            <p className="gh-modal-title">{homme.title}</p>
          </div>
        </div>

        {/* Body */}
        <div className="gh-modal-body">
          {homme.tags?.length > 0 && (
            <div className="gh-modal-tags">
              {homme.tags.map(tag => (
                <span key={tag} className="gh-tag">
                  <Tag size={11} /> {tag}
                </span>
              ))}
            </div>
          )}
          <p className="gh-modal-desc">
            {isExpanded || !isLong 
              ? homme.description 
              : homme.description.slice(0, DESC_LIMIT) + '...'}
          </p>

          {isLong && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem', marginTop: 12, fontWeight: 600, padding: 0 }}
            >
              {isExpanded ? (
                <><ChevronUp size={18} /> {t('grandsHommes.modal_read_less')}</>
              ) : (
                <><ChevronDown size={18} /> {t('grandsHommes.modal_read_more')}</>
              )}
            </button>
          )}

          <div className="gh-modal-footer">
            <Link to="/catalogue" state={{ searchAuthor: homme.name }} className="btn btn-outline" onClick={onClose}>
              <BookOpen size={15} /> {t('grandsHommes.modal_related_books')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════ */
export default function GrandsHommes() {
  const { t } = useTranslation();
  const [hommes,  setHommes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    grandsHommesAPI.getAll()
      .then(({ data }) => setHommes(data.hommes || []))
      .catch(() => setError(t('grandsHommes.load_error')))
      .finally(() => setLoading(false));
  }, [t]);

  /* Tous les tags uniques */
  const allTags = useMemo(() => {
    const set = new Set();
    hommes.forEach(h => h.tags?.forEach(t => set.add(t)));
    return [...set].sort();
  }, [hommes]);

  /* Filtrage */
  const filtered = useMemo(() => {
    let list = hommes;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      list = list.filter(h => h.tags?.includes(activeTag));
    }
    return list;
  }, [hommes, search, activeTag]);

  return (
    <div className="grands-hommes-page" style={{ marginTop: 'var(--nav-h)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="gh-hero">
        <div className="gh-hero-overlay" />
        <div className="container gh-hero-content">
          <Link to="/" className="gh-back-btn">
            <ArrowLeft size={20} /> {t('grandsHommes.backHome')}
          </Link>
          <div className="gh-hero-text">
            <h1>{t('grandsHommes.hero_title')}</h1>
            <p>{t('grandsHommes.hero_desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Contenu ──────────────────────────────────────── */}
      <section className="gh-content-section container">
        <div className="gh-header">
          <h2>{t('grandsHommes.content_title')}</h2>
          <p className="gh-subtitle">
            {loading ? t('common.loading') : t('grandsHommes.content_sub', { count: hommes.length })}
          </p>
        </div>

        {/* ── Barre de recherche + filtre tags ─────────── */}
        {!loading && !error && hommes.length > 0 && (
          <div className="gh-filters">
            <div className="gh-search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder={t('grandsHommes.search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="gh-search-clear" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="gh-tag-filters">
              <button
                className={`gh-tag-btn ${!activeTag ? 'active' : ''}`}
                onClick={() => setActiveTag('')}
              >{t('common.all')}</button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`gh-tag-btn ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                >{tag}</button>
              ))}
            </div>
          </div>
        )}

        {/* ── États de chargement / erreur / vide ──────── */}
        {error && (
          <div className="gh-error-state">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* ── Grille ───────────────────────────────────── */}
        <div className="gh-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map((homme, index) => {
                const [bg1, bg2, accent] = getPalette(homme.name);
                return (
                  <div
                    className="gh-card"
                    key={homme._id}
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {/* Image ou placeholder coloré */}
                    <div className="gh-card-img-wrapper">
                      {homme.image ? (
                        <img
                          src={homme.image}
                          alt={homme.name}
                          className="gh-card-img"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div
                        className="gh-card-img-placeholder"
                        style={{
                          display: homme.image ? 'none' : 'flex',
                          background: `linear-gradient(145deg, ${bg1}, ${bg2})`,
                        }}
                      >
                        <BookOpen size={48} color={accent} strokeWidth={1} />
                        <span style={{ color: accent, fontSize: '0.75rem', fontWeight: 600, marginTop: 8, textAlign: 'center', opacity: 0.85 }}>
                          {homme.name.slice(0, 20)}
                        </span>
                      </div>
                      {homme.dates && (
                        <div className="gh-card-dates">
                          <Calendar size={12} /> {homme.dates}
                        </div>
                      )}
                    </div>

                    {/* Corps */}
                    <div className="gh-card-body">
                      <h3 className="gh-card-title">{homme.name}</h3>
                      <h4 className="gh-card-subtitle">{homme.title}</h4>
                      {homme.tags?.length > 0 && (
                        <div className="gh-card-tags">
                          {homme.tags.map(tag => (
                            <span
                              key={tag}
                              className="gh-tag gh-tag-clickable"
                              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                            >{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="gh-card-desc">
                        {homme.description.length > 180
                          ? homme.description.slice(0, 180) + '…'
                          : homme.description}
                      </p>
                      <div className="gh-card-footer">
                        <button
                          className="gh-read-more"
                          onClick={() => setSelected(homme)}
                        >
                          <ExternalLink size={15} /> {t('grandsHommes.read_more')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>

        {/* Résultats vides */}
        {!loading && !error && filtered.length === 0 && hommes.length > 0 && (
          <div className="gh-empty-results">
            <Search size={32} />
            <p>{t('grandsHommes.no_results')}</p>
            <button className="btn btn-outline" onClick={() => { setSearch(''); setActiveTag(''); }}>
              {t('grandsHommes.reset_filters')}
            </button>
          </div>
        )}

        {!loading && !error && hommes.length === 0 && (
          <div className="gh-empty-results">
            <BookOpen size={32} />
            <p>{t('grandsHommes.no_bios')}</p>
          </div>
        )}

        {/* ── Bannière bas de page ──────────────────────── */}
        {!loading && !error && (
          <div className="gh-info-banner">
            <div className="gh-info-icon"><Info size={24} /></div>
            <div>
              <h3>{t('grandsHommes.banner_title')}</h3>
              <p>{t('grandsHommes.banner_desc')}</p>
              <Link to="/catalogue" className="btn btn-outline" style={{ marginTop: 15, display: 'inline-block' }}>
                {t('grandsHommes.banner_btn')}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── Modal ────────────────────────────────────────── */}
      {selected && (
        <DetailModal homme={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
