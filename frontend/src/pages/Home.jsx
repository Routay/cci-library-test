import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BookOpen, ClipboardList, Users, BookMarked,
  Moon, Star, BookText, Heart, Globe, MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { settingsAPI } from '../services/api';
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
  'Autres':   <MoreHorizontal size={28} strokeWidth={1.5} />,
};

const MAIN_CATEGORIES = ['Aqida', 'Fiqh', 'Sira', 'Hadith', 'Tazkiyya', 'Tawhid', 'Aqîda', 'Sîra', 'Tawhîd'];

export default function Home() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeMembers: 0,
    activeLoans: 0,
    weeklyBook: null,
    categoriesCount: [],
    recentBooks: [],
  });
  const [pubSettings, setPubSettings] = useState(null);

  useEffect(() => {
    api.get('/api/stats/public')
      .then(res => setStats(res.data))
      .catch(err => console.error('Erreur chargement stats:', err));
      
    settingsAPI.getPublic()
      .then(res => setPubSettings(res.data))
      .catch(() => {});
  }, []);

  const mainCats = [];
  let othersCount = 0;
  
  if (stats.categoriesCount && stats.categoriesCount.length > 0) {
    stats.categoriesCount.forEach(cat => {
      if (MAIN_CATEGORIES.includes(cat._id)) {
        mainCats.push(cat);
      } else {
        othersCount += cat.count;
      }
    });
    mainCats.push({ _id: 'Autres', count: othersCount });
  }

  return (
    <div className="home">
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${HERO_IMG})` }}>
          <div className="hero-bg-overlay" />
        </div>
        <div className="hero-content container">
          <h1 className="hero-title animate-fadeUp">
            {t('home.hero_title')} <span className="hero-title-cci">CCI</span>
          </h1>
          <p className="hero-subtitle animate-fadeUp" style={{ animationDelay: '0.15s' }}>
            <span className="hero-script">{t('home.hero_script')}</span>
          </p>
        </div>
      </section>

      {/* ─── WELCOME ──────────────────────────────────────── */}
      <section className="welcome section">
        <div className="container">
          <div className="arabic-greeting animate-fadeUp">
            ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ
          </div>
          {t('home.salam_trans') && (
            <p className="animate-fadeUp" style={{ animationDelay: '0.05s', textAlign: 'center', fontSize: '1rem', color: 'var(--txt3)', marginTop: '-15px', marginBottom: '30px', fontStyle: 'italic' }}>
              {t('home.salam_trans')}
            </p>
          )}

          <p className="welcome-label">{t('home.welcome_label')}</p>

          <h2 className="welcome-title animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            {t('home.welcome_title')}
          </h2>

          <p className="welcome-desc animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            {t('home.welcome_desc')}
          </p>

          <hr className="welcome-divider" />

          {/* Two action cards */}
          <div className="action-grid animate-fadeUp" style={{ animationDelay: '0.3s' }}>
            <div className="action-card card">
              <div className="action-icon">
                <BookOpen size={36} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              </div>
              <h3>{t('home.action_books_title')}</h3>
              <p>{t('home.action_books_desc')}</p>
              <Link to="/catalogue" className="action-link">{t('home.action_books_link')}</Link>
            </div>

            <div className="action-card card">
              <div className="action-icon">
                <ClipboardList size={36} strokeWidth={1.5} style={{ color: 'var(--gold)' }} />
              </div>
              <h3>{t('home.action_loan_title')}</h3>
              <p>{t('home.action_loan_desc')}</p>
              <Link to="/emprunts" className="action-link">{t('home.action_loan_link')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid animate-fadeUp">
            {[
              { value: `${stats.totalBooks}+`,    label: t('home.stats_books'), icon: <BookMarked size={20} /> },
              { value: '3',                       label: t('home.stats_langs'),              icon: <Globe size={20} /> },
              { value: `${pubSettings?.loanDurationDays || 30}`, label: t('home.stats_duration'),    icon: <ClipboardList size={20} /> },
              { value: stats.weeklyBook ? '1' : '0', label: t('home.stats_weekly'), icon: <Star size={20} /> },
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
                {t('home.weekly_tag')}
              </span>
              <h2 className="mt-4">{t('home.weekly_title')}</h2>
              <p>{t('home.weekly_desc')}</p>
              <Link to="/livre-semaine" className="btn btn-primary mt-4">
                {t('home.weekly_btn')}
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
              <h2 className="section-title">{t('home.recent_title')}</h2>
              <p className="section-sub">{t('home.recent_sub')}</p>
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
              <Link to="/catalogue" className="btn btn-outline">{t('home.recent_btn')}</Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── DISCOVER MORE ────────────────────────────────── */}
      <section className="discover section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('home.discover_title')}</h2>
            <p className="section-sub">{t('home.discover_sub')}</p>
          </div>
          <div className="categories-grid">
            {mainCats.length > 0 ? mainCats.map((cat, i) => (
              <Link to="/catalogue" state={{ category: cat._id }} className="cat-card card" key={cat._id} style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="cat-icon">{CAT_ICONS[cat._id] || <BookOpen size={28} strokeWidth={1.5} />}</span>
                <h4>{cat._id}</h4>
                <p>{cat.count} {t('common.books')}</p>
              </Link>
            )) : [
              { icon: CAT_ICONS['Aqida'],    title: 'Aqîda',     desc: 'Croyance islamique', id: 'Aqida' },
              { icon: CAT_ICONS['Tawhid'],   title: 'Tawhîd',    desc: 'Unicité divine', id: 'Tawhid' },
              { icon: CAT_ICONS['Fiqh'],     title: 'Fiqh',      desc: 'Jurisprudence', id: 'Fiqh' },
              { icon: CAT_ICONS['Sira'],     title: 'Sîra',      desc: 'Biographie du Prophète ﷺ', id: 'Sira' },
              { icon: CAT_ICONS['Hadith'],   title: 'Hadith',    desc: 'Traditions prophétiques', id: 'Hadith' },
              { icon: CAT_ICONS['Tazkiyya'],title: 'Tazkiyya',  desc: "Purification de l'âme", id: 'Tazkiyya' },
              { icon: CAT_ICONS['Autres'],   title: 'Autres',    desc: 'Autres thématiques', id: 'Autres' },
            ].map((cat, i) => (
              <Link to="/catalogue" state={{ category: cat.id }} className="cat-card card" key={i} style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="cat-icon">{cat.icon}</span>
                <h4>{cat.title}</h4>
                <p>{cat.desc}</p>
              </Link>
            ))}
          </div>
          <div className="discover-cta">
            <Link to="/catalogue" className="btn btn-outline">{t('home.discover_btn')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}