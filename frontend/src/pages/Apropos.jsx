import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsAPI } from '../services/api';
import api from '../services/api';
import { BookOpen, Moon, Users, Star, BookText, Heart, MapPin, BookMarked, ClipboardList, Globe, MoreHorizontal } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import './Apropos.css';

// SVG personnalisé pour la mosquée (Aqîda)
const MosqueIcon = ({ size = 24, className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={size} height={size} className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

const COLLECTION_CATS = [
  { icon: <MosqueIcon size={28} />,     label: 'Aqîda',    id: 'Aqida',    desc: 'Croyance islamique' },
  { icon: <Star size={28} strokeWidth={1.5} />,      label: 'Tawhîd',   id: 'Tawhid',   desc: 'Unicité divine' },
  { icon: <BookText size={28} strokeWidth={1.5} />,  label: 'Fiqh',     id: 'Fiqh',     desc: 'Jurisprudence' },
  { icon: <Moon size={28} strokeWidth={1.5} />,      label: 'Sîra',     id: 'Sira',     desc: 'Biographie du Prophète ﷺ' },
  { icon: <BookOpen size={28} strokeWidth={1.5} />,  label: 'Hadith',   id: 'Hadith',   desc: 'Traditions prophétiques' },
  { icon: <Heart size={28} strokeWidth={1.5} />,     label: 'Tazkiyya', id: 'Tazkiyya', desc: 'Purification de l\'âme' },
  { icon: <MoreHorizontal size={28} strokeWidth={1.5} />, label: 'Autres', id: 'Autres', desc: 'Autres thématiques' },
];

export default function Apropos() {
  const [stats, setStats] = useState({ totalBooks: 0, activeMembers: 0, activeLoans: 0, weeklyBook: null });
  const [pubSettings, setPubSettings] = useState(null);
  const { t } = useTranslation();

  const MISSION_ITEMS = [
    {
      icon: <BookOpen size={32} strokeWidth={1.5} />,
      title: t('apropos.mission1_title'),
      desc: t('apropos.mission1_desc'),
    },
    {
      icon: <Moon size={32} strokeWidth={1.5} />,
      title: t('apropos.mission2_title'),
      desc: t('apropos.mission2_desc'),
    },
    {
      icon: <Users size={32} strokeWidth={1.5} />,
      title: t('apropos.mission3_title'),
      desc: t('apropos.mission3_desc'),
    },
  ];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    api.get('/api/stats/public')
      .then(res => setStats(res.data))
      .catch(() => {});
    
    settingsAPI.getPublic()
      .then(res => setPubSettings(res.data))
      .catch(() => {});
  }, []);

  // Scroll animations
  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.ap-reveal').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="apropos-page">

      {/* ── Typographie anti-cache : garantit que les nouvelles tailles
          s'affichent même si le navigateur a le CSS en cache.
          Priorité inline > feuille CSS externe. ── */}
      {/* ── Anti-cache : CSS injecté dans le bundle JS, immunisé au cache navigateur ── */}
      <style>{`
        /* Page */
        .apropos-page { overflow-x: hidden; }

        /* ── Hero ── */
        .ap-hero-title {
          font-size: clamp(1.9rem, 6.5vw, 5rem) !important;
          line-height: 1.08 !important;
        }
        .ap-hero-sub {
          font-size: clamp(1.02rem, 1.5vw + 0.4rem, 1.2rem) !important;
          line-height: 1.82 !important;
        }
        .ap-hero-arabic {
          font-size: clamp(1.3rem, 2vw + 0.5rem, 1.9rem) !important;
        }
        .ap-hero-trans {
          font-size: clamp(0.92rem, 1vw + 0.35rem, 1.05rem) !important;
        }

        /* ── Section descriptions ── */
        .ap-section-desc {
          font-size: clamp(1.02rem, 1.3vw + 0.4rem, 1.18rem) !important;
          line-height: 1.9 !important;
        }

        /* ── Mission cards ── */
        .ap-mission-card h3 {
          font-size: clamp(1.2rem, 1.6vw + 0.4rem, 1.5rem) !important;
        }
        .ap-mission-card p {
          font-size: clamp(0.98rem, 1.1vw + 0.4rem, 1.1rem) !important;
          line-height: 1.82 !important;
        }

        /* ── Bibliothèque ── */
        .ap-lib-desc {
          font-size: clamp(1rem, 1.2vw + 0.4rem, 1.15rem) !important;
          line-height: 1.9 !important;
        }
        .ap-lib-features li {
          font-size: clamp(1rem, 1.1vw + 0.4rem, 1.1rem) !important;
        }

        /* ── Catégories ── */
        .ap-cat-label {
          font-size: clamp(0.95rem, 1.1vw + 0.35rem, 1.08rem) !important;
        }
        .ap-cat-desc {
          font-size: clamp(0.82rem, 0.9vw + 0.3rem, 0.92rem) !important;
        }

        /* ── Stats ── */
        .ap-stat-value {
          font-size: clamp(1.9rem, 3.5vw + 0.5rem, 2.8rem) !important;
        }
        .ap-stat-label {
          font-size: clamp(0.88rem, 0.9vw + 0.4rem, 1rem) !important;
        }

        /* ── Contact ── */
        .ap-contact-card h3 {
          font-size: clamp(1.25rem, 1.5vw + 0.5rem, 1.6rem) !important;
        }
        .ap-contact-list li {
          font-size: clamp(0.92rem, 1vw + 0.35rem, 1.05rem) !important;
        }

        /* ── Citation — sans bande jaune ── */
        .ap-citation-card {
          border-left: none !important;
          border: 1px solid rgba(27, 104, 48, 0.30) !important;
          box-shadow: 0 4px 32px rgba(27, 104, 48, 0.12),
                      inset 0 0 0 1px rgba(255,255,255,0.04) !important;
        }
        .ap-citation-arabic {
          font-size: clamp(1.4rem, 2vw + 0.5rem, 2rem) !important;
        }
        .ap-citation-trans {
          font-size: clamp(0.98rem, 1.1vw + 0.4rem, 1.1rem) !important;
          line-height: 1.78 !important;
        }
        .ap-citation-ref {
          font-size: clamp(0.78rem, 0.85vw + 0.3rem, 0.92rem) !important;
        }

        /* ── Responsive anti-cache ── */
        @media (max-width: 768px) {
          .ap-hero-title { font-size: clamp(1.9rem, 7vw, 3.2rem) !important; }
        }
        @media (max-width: 600px) {
          /* Mission card : CSS Grid 2 zones garanties */
          .ap-mission-card {
            display: grid !important;
            grid-template-columns: 52px 1fr !important;
            grid-template-rows: auto auto !important;
            grid-template-areas: "icon title" "desc desc" !important;
            column-gap: 14px !important;
            row-gap: 10px !important;
            padding: 20px 18px !important;
            text-align: left !important;
            align-items: center !important;
          }
          .ap-mission-icon {
            grid-area: icon !important;
            width: 52px !important;
            height: 52px !important;
            align-self: center !important;
          }
          .ap-mission-card h3 {
            grid-area: title !important;
            font-size: clamp(1rem, 4vw, 1.2rem) !important;
            text-align: left !important;
            margin: 0 !important;
            align-self: center !important;
          }
          .ap-mission-card p {
            grid-area: desc !important;
            font-size: clamp(0.9rem, 3.5vw, 1rem) !important;
            text-align: left !important;
            margin: 0 !important;
            line-height: 1.65 !important;
          }
          .ap-hero-title  { font-size: clamp(1.7rem, 8vw, 2.6rem) !important; }
          .ap-stat-value  { font-size: clamp(1.6rem, 7vw, 2.2rem) !important; }
        }
        @media (max-width: 480px) {
          .ap-mission-card {
            grid-template-columns: 46px 1fr !important;
            column-gap: 12px !important;
            padding: 16px 14px !important;
          }
          .ap-mission-icon   { width: 46px !important; height: 46px !important; }
          .ap-mission-card h3 { font-size: clamp(0.95rem, 4vw, 1.1rem) !important; }
          .ap-mission-card p  { font-size: clamp(0.88rem, 3.5vw, 0.98rem) !important; }
        }
        @media (max-width: 380px) {
          .ap-hero-title { font-size: clamp(1.55rem, 8.5vw, 2.2rem) !important; }
          .ap-citation-arabic { font-size: clamp(1.2rem, 6vw, 1.6rem) !important; }
          .ap-mission-card {
            grid-template-columns: 40px 1fr !important;
            column-gap: 10px !important;
            padding: 14px 12px !important;
          }
          .ap-mission-icon { width: 40px !important; height: 40px !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="ap-hero">
        <div className="ap-hero-orb ap-hero-orb-1" />
        <div className="ap-hero-orb ap-hero-orb-2" />
        <div className="container ap-hero-content">
          <span className="eyebrow anim-up">{t('apropos.hero_eyebrow')}</span>
          <h1 className="ap-hero-title anim-up d1">
            {t('apropos.hero_title')} <span className="serif-italic">CCI</span>
          </h1>
          <div className="gold-line anim-up d2" style={{ maxWidth: 120 }} />
          <p className="ap-hero-sub anim-up d2">
            {t('apropos.hero_sub')}
          </p>

          {/* Arabesque décoratif */}
          <div className="ap-hero-bismillah">
            <div className="ap-hero-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            {t('apropos.bismillah_trans') && (
              <div className="ap-hero-trans">{t('apropos.bismillah_trans')}</div>
            )}
          </div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────── */}
      <section className="section ap-section-bg-alt">
        <div className="container">
          <div className="ap-section-header ap-reveal">
            <span className="eyebrow">{t('apropos.mission_eyebrow')}</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>{t('apropos.mission_title')}</h2>
            <p className="ap-section-desc">
              {t('apropos.mission_desc')}
            </p>
          </div>

          <div className="ap-mission-grid">
            {MISSION_ITEMS.map((item, i) => (
              <div className="ap-mission-card card ap-reveal" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="ap-mission-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BIBLIOTHÈQUE ─────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="ap-lib-layout">
            {/* Texte */}
            <div className="ap-lib-text ap-reveal">
              <span className="eyebrow">{t('apropos.lib_eyebrow')}</span>
              <h2 className="section-title" style={{ marginTop: 8 }}>{t('apropos.lib_title')}</h2>
              <div className="gold-line" />
              <p className="ap-lib-desc">
                <Trans 
                  i18nKey="apropos.lib_desc"
                  components={{ 1: <strong />, 3: <strong />, 5: <strong /> }}
                />
              </p>
              <ul className="ap-lib-features">
                <li><span>✦</span> {t('apropos.lib_f1')}</li>
                <li><span>✦</span> {t('apropos.lib_f2')}</li>
                <li><span>✦</span> {t('apropos.lib_f3', { days: pubSettings?.loanDurationDays || 30 })}</li>
                <li><span>✦</span> {t('apropos.lib_f4')}</li>
              </ul>
              <Link to="/catalogue" className="btn btn-gold" style={{ marginTop: 24 }}>
                {t('apropos.lib_btn')}
              </Link>
            </div>

            {/* Grille catégories */}
            <div className="ap-cat-grid ap-reveal">
              {COLLECTION_CATS.map((cat, i) => (
                <Link to="/catalogue" state={{ category: cat.id }} className="ap-cat-item card" key={i}>
                  <span className="ap-cat-icon">{cat.icon}</span>
                  <span className="ap-cat-label">{cat.label}</span>
                  <span className="ap-cat-desc">{cat.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS RAPIDES (dynamiques) ─────────────────── */}
      <section className="ap-stats-section">
        <div className="container">
          <div className="ap-stats-grid ap-reveal">
            {[
              { value: `${stats.totalBooks}+`,    label: t('apropos.stats_books'), icon: <BookMarked size={20} /> },
              { value: '3',                       label: t('apropos.stats_langs'),              icon: <Globe size={20} /> },
              { value: `${pubSettings?.loanDurationDays || 30}`, label: t('apropos.stats_duration'),    icon: <ClipboardList size={20} /> },
              { value: stats.weeklyBook ? '1' : '0', label: t('apropos.stats_weekly'), icon: <Star size={20} /> },
            ].map((s, i) => (
              <div className="ap-stat-item" key={i}>
                <span className="ap-stat-icon-wrap">{s.icon}</span>
                <span className="ap-stat-value">{s.value}</span>
                <span className="ap-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="ap-contact-layout">
            {/* Infos pratiques */}
            <div className="ap-contact-card card ap-reveal">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} style={{ color: 'var(--gold)' }} /> {t('apropos.contact_title')}</h3>
              <ul className="ap-contact-list">
                <li>
                  <span className="ap-contact-key">{t('apropos.contact_loc')}</span>
                  <span>{pubSettings?.address || 'Salle CCI, École Supérieure Polytechnique, Dakar'}</span>
                </li>
                <li>
                  <span className="ap-contact-key">{t('apropos.contact_hours')}</span>
                  <span>{pubSettings?.openingHours || 'Lundi — Vendredi : 9h00 – 19h00'}</span>
                </li>
                <li>
                  <span className="ap-contact-key">{t('apropos.contact_email')}</span>
                  <a href={`mailto:${pubSettings?.contactEmail || 'routaydev@gmail.com'}`} className="ap-contact-link">
                    {pubSettings?.contactEmail || 'routaydev@gmail.com'}
                  </a>
                </li>
                <li>
                  <span className="ap-contact-key">{t('apropos.contact_phone')}</span>
                  <a href={`tel:${(pubSettings?.contactPhone || '+221784290065').replace(/\s+/g, '')}`} className="ap-contact-link">
                    {pubSettings?.contactPhone || '+221 78 429 00 65'}
                  </a>
                </li>
              </ul>
            </div>

            {/* Citation */}
            <div className="ap-citation-card ap-reveal">
              <div className="ap-citation-arabic">
                إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ
              </div>
              {t('apropos.citation_trans') && (
                <p className="ap-citation-trans">
                  {t('apropos.citation_trans')}
                </p>
              )}
              <p className="ap-citation-ref">{t('apropos.citation_ref')}</p>
              <div className="ap-citation-actions">
                <Link to="/emprunts" className="btn btn-gold btn-sm">{t('apropos.btn_loan')}</Link>
                <Link to="/catalogue" className="btn btn-glass btn-sm">{t('apropos.btn_catalog')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}