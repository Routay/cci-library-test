import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, Users, BookMarked,
  Moon, Star, BookText, Heart, Globe
} from 'lucide-react';
import api from '../services/api';
import BookCover from '../components/BookCover';
import HERO_IMG from '../assets/hero.png';
import './Home.css';

// Icônes SVG professionnelles pour les catégories
const CAT_ICONS = {
  'Aqida':    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:28,height:28}}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  'Tawhid':   <Star size={28} strokeWidth={1.5} />,
  'Fiqh':     <BookText size={28} strokeWidth={1.5} />,
  'Sira':     <Moon size={28} strokeWidth={1.5} />,
  'Hadith':   <BookOpen size={28} strokeWidth={1.5} />,
  'Tazkiyya': <Heart size={28} strokeWidth={1.5} />,
};

export default function Home() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeMembers: 0,
    activeLoans: 0,
    weeklyBook: null,
    categoriesCount: [],
    recentBooks: [],
  });

  useEffect(() => {
    api.get('/api/stats/public')
      .then(res => setStats(res.data))
      .catch(err => console.error('Erreur chargement stats:', err));
  }, []);

  return (
    <div className="home">
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${HERO_IMG})` }}>
          <div className="hero-bg-overlay" />
        </div>
        <div className="hero-content container">
          <h1 className="hero-title animate-fadeUp">
            Bibliothèque <span className="hero-title-cci">CCI</span>
          </h1>
          <p className="hero-subtitle animate-fadeUp" style={{ animationDelay: '0.15s' }}>
            <span className="hero-script">Islamique</span>
          </p>
        </div>
      </section>

      {/* ─── WELCOME ──────────────────────────────────────── */}
      <section className="welcome section">
        <div className="container">
          <div className="arabic-greeting animate-fadeUp">
            ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ
          </div>
          <p className="animate-fadeUp" style={{ animationDelay: '0.05s', textAlign: 'center', fontSize: '0.9rem', color: 'var(--txt3)', marginTop: '-15px', marginBottom: '30px', fontStyle: 'italic' }}>
            « Que la paix, la miséricorde d'Allah et Ses bénédictions soient sur vous. »
          </p>

          <p className="welcome-label">Welcome</p>

          <h2 className="welcome-title animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            La bibliothèque du Comité Culturel Islamique (CCI)
            vous souhaite la bienvenue !
          </h2>

          <p className="welcome-desc animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            Retrouvez ici la liste des ouvrages disponibles, comment les emprunter
            et toutes les infos utiles.
          </p>

          <hr className="welcome-divider" />

          {/* Two action cards */}
          <div className="action-grid animate-fadeUp" style={{ animationDelay: '0.3s' }}>
            <div className="action-card card">
              <div className="action-icon">
                <BookOpen size={36} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              </div>
              <h3>Liste des ouvrages</h3>
              <p>Parcourez nos livres disponibles.</p>
              <Link to="/catalogue" className="action-link">Cliquez ici.</Link>
            </div>

            <div className="action-card card">
              <div className="action-icon">
                <ClipboardList size={36} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              </div>
              <h3>Formulaire d'emprunt de livres</h3>
              <p>Veuillez remplir le formulaire si vous souhaitez emprunter un livre.</p>
              <Link to="/emprunts" className="action-link">Cliquez ici.</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid animate-fadeUp">
            {[
              { value: `${stats.totalBooks}+`,    label: 'Ouvrages disponibles', icon: <BookMarked size={20} /> },
              { value: '3',                       label: 'Langues',              icon: <Globe size={20} /> },
              { value: '1 mois', label: 'Durée d\'emprunt max',    icon: <ClipboardList size={20} /> },
              { value: stats.weeklyBook ? '1' : '0', label: 'Livre de la semaine', icon: <Star size={20} /> },
            ].map((s, i) => (
              <div className="stat-item" key={i}>
                <span className="stat-icon-wrap">{s.icon}</span>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOOK OF THE WEEK TEASER ─────────────────────── */}
      <section className="weekly-teaser section">
        <div className="container">
          <div className="weekly-inner card">
            <div className="weekly-text">
              <span className="tag tag-gold">
                <BookOpen size={13} style={{ display:'inline', verticalAlign:'middle', marginRight:5 }} />
                Cette semaine
              </span>
              <h2 className="mt-4">Le livre de la semaine</h2>
              <p>Chaque semaine, notre comité vous recommande un ouvrage de notre collection. Découvrez la sélection du moment.</p>
              <Link to="/livre-semaine" className="btn btn-primary mt-4">
                Voir le livre ›
              </Link>
            </div>
            <div className="weekly-cover">
              {stats.weeklyBook ? (
                <BookCover
                  title={stats.weeklyBook.title}
                  author={stats.weeklyBook.author}
                  coverUrl={stats.weeklyBook.cover}
                  size="lg"
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                />
              ) : (
                <div className="cover-placeholder">
                  <BookOpen size={48} strokeWidth={1} style={{ color: 'var(--gold)', opacity: 0.6 }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── NOUVEAUTÉS ────────────────────────────────────── */}
      {stats.recentBooks?.length > 0 && (
        <section className="discover section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Nouveautés & Mises à jour</h2>
              <p className="section-sub">Les derniers ouvrages ajoutés ou mis à jour par nos administrateurs</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {stats.recentBooks.map((book, i) => (
                <Link to="/catalogue" key={book._id} className="card" style={{ overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column', animationDelay: `${i * 0.08}s` }}>
                  <div style={{ height: 260 }}>
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={book.cover}
                      size="md"
                      style={{ width: '100%', height: '100%', borderRadius: '8px 8px 0 0' }}
                    />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginBottom: 6, display: 'inline-block' }}>{book.category}</span>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--txt1)', margin: 0, lineHeight: 1.3 }}>{book.title}</p>
                    <p style={{ color: 'var(--txt3)', fontSize: '0.78rem', marginTop: 4 }}>{book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="discover-cta" style={{ marginTop: 28 }}>
              <Link to="/catalogue" className="btn btn-outline">Voir tout le catalogue →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── DISCOVER MORE ────────────────────────────────── */}
      <section className="discover section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Découvrez notre collection</h2>
            <p className="section-sub">Des ouvrages soigneusement sélectionnés pour vous</p>
          </div>
          <div className="categories-grid">
            {stats.categoriesCount.length > 0 ? stats.categoriesCount.map((cat, i) => (
              <Link to="/catalogue" className="cat-card card" key={cat._id} style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="cat-icon">{CAT_ICONS[cat._id] || <BookOpen size={28} strokeWidth={1.5} />}</span>
                <h4>{cat._id}</h4>
                <p>{cat.count} livres</p>
              </Link>
            )) : [
              { icon: CAT_ICONS['Aqida'],    title: 'Aqîda',     desc: 'Croyance islamique' },
              { icon: CAT_ICONS['Tawhid'],   title: 'Tawhîd',    desc: 'Unicité divine' },
              { icon: CAT_ICONS['Fiqh'],     title: 'Fiqh',      desc: 'Jurisprudence' },
              { icon: CAT_ICONS['Sira'],     title: 'Sîra',      desc: 'Biographie du Prophète ﷺ' },
              { icon: CAT_ICONS['Hadith'],   title: 'Hadith',    desc: 'Traditions prophétiques' },
              { icon: CAT_ICONS['Tazkiyya'],title: 'Tazkiyya',  desc: "Purification de l'âme" },
            ].map((cat, i) => (
              <Link to="/catalogue" className="cat-card card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="cat-icon">{cat.icon}</span>
                <h4>{cat.title}</h4>
                <p>{cat.desc}</p>
              </Link>
            ))}
          </div>
          <div className="discover-cta">
            <Link to="/catalogue" className="btn btn-outline">Voir tout le catalogue →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}