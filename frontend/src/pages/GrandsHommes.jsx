import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Info, Search, X, Tag, Calendar, ExternalLink } from 'lucide-react';
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
          <p className="gh-modal-desc">{homme.description}</p>

          <div className="gh-modal-footer">
            <Link to="/catalogue" className="btn btn-outline" onClick={onClose}>
              <BookOpen size={15} /> Voir les ouvrages liés
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
      .catch(() => setError('Impossible de charger les données. Veuillez réessayer.'))
      .finally(() => setLoading(false));
  }, []);

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
        h.tags?.some(t => t.toLowerCase().includes(q))
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
            <ArrowLeft size={20} /> Retour à l'accueil
          </Link>
          <div className="gh-hero-text">
            <h1>Les Grands Hommes de l'Islam</h1>
            <p>
              Découvrez la vie, les œuvres et l'héritage impérissable des figures
              qui ont illuminé l'histoire de la civilisation islamique par leur savoir,
              leur sagesse et leur courage.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contenu ──────────────────────────────────────── */}
      <section className="gh-content-section container">
        <div className="gh-header">
          <h2>Biographies &amp; Héritage</h2>
          <p className="gh-subtitle">
            {loading ? 'Chargement…' : `${hommes.length} personnalité${hommes.length > 1 ? 's' : ''} — une sélection de savants et leaders inspirants`}
          </p>
        </div>

        {/* ── Barre de recherche + filtre tags ─────────── */}
        {!loading && !error && hommes.length > 0 && (
          <div className="gh-filters">
            <div className="gh-search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher un nom, un thème…"
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
              >Tous</button>
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
              Réessayer
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
                          <ExternalLink size={15} /> En savoir plus
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
            <p>Aucune personnalité ne correspond à votre recherche.</p>
            <button className="btn btn-outline" onClick={() => { setSearch(''); setActiveTag(''); }}>
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!loading && !error && hommes.length === 0 && (
          <div className="gh-empty-results">
            <BookOpen size={32} />
            <p>Aucune biographie disponible pour le moment.</p>
          </div>
        )}

        {/* ── Bannière bas de page ──────────────────────── */}
        {!loading && !error && (
          <div className="gh-info-banner">
            <div className="gh-info-icon"><Info size={24} /></div>
            <div>
              <h3>Envie d'aller plus loin ?</h3>
              <p>
                Consultez notre catalogue pour retrouver les ouvrages originaux
                et les études consacrées à ces grands hommes.
              </p>
              <Link to="/catalogue" className="btn btn-outline" style={{ marginTop: 15, display: 'inline-block' }}>
                Explorer le catalogue
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
