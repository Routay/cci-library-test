import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { settingsAPI } from '../services/api';
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
      title: 'Accès au savoir',
      desc: 'Mettre à la disposition de tous les étudiants ESP une bibliothèque islamique riche et diversifiée.',
    },
    {
      icon: <Moon size={32} strokeWidth={1.5} />,
      title: 'Culture islamique',
      desc: 'Promouvoir les valeurs et la culture islamiques au sein de la communauté universitaire.',
    },
    {
      icon: <Users size={32} strokeWidth={1.5} />,
      title: 'Fraternité',
      desc: 'Renforcer les liens fraternels entre les membres de la communauté musulmane de l\'ESP.',
    },
  ];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/stats/public')
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
        </div>
        {/* Arabesque décoratif */}
        <div className="ap-hero-bismillah">
          <div className="ap-hero-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          {t('apropos.bismillah_trans') && (
            <div className="ap-hero-trans">{t('apropos.bismillah_trans')}</div>
          )}
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