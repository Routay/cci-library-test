import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Moon, Users, Star, BookText, Heart, MapPin, BookMarked, ClipboardList, Globe } from 'lucide-react';
import './Apropos.css';

// SVG personnalisé pour la mosquée (Aqîda)
const MosqueIcon = ({ size = 24, className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width={size} height={size} className={className}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

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

const COLLECTION_CATS = [
  { icon: <MosqueIcon size={28} />,     label: 'Aqîda',    desc: 'Croyance islamique' },
  { icon: <Star size={28} strokeWidth={1.5} />,      label: 'Tawhîd',   desc: 'Unicité divine' },
  { icon: <BookText size={28} strokeWidth={1.5} />,  label: 'Fiqh',     desc: 'Jurisprudence' },
  { icon: <Moon size={28} strokeWidth={1.5} />,      label: 'Sîra',     desc: 'Biographie du Prophète ﷺ' },
  { icon: <BookOpen size={28} strokeWidth={1.5} />,  label: 'Hadith',   desc: 'Traditions prophétiques' },
  { icon: <Heart size={28} strokeWidth={1.5} />,     label: 'Tazkiyya', desc: 'Purification de l\'âme' },
];

export default function Apropos() {
  const [stats, setStats] = useState({ totalBooks: 0, activeMembers: 0, activeLoans: 0, weeklyBook: null });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/stats/public')
      .then(res => setStats(res.data))
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
          <span className="eyebrow anim-up">Comité Culturel Islamique</span>
          <h1 className="ap-hero-title anim-up d1">
            À propos du <span className="serif-italic">CCI</span>
          </h1>
          <div className="gold-line anim-up d2" style={{ maxWidth: 120 }} />
          <p className="ap-hero-sub anim-up d2">
            L'association islamique de l'École Supérieure Polytechnique de Dakar
          </p>
        </div>
        {/* Arabesque décoratif */}
        <div className="ap-hero-bismillah">
          <div className="ap-hero-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
          <div className="ap-hero-trans">« Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux »</div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────── */}
      <section className="section ap-section-bg-alt">
        <div className="container">
          <div className="ap-section-header ap-reveal">
            <span className="eyebrow">Pourquoi nous existons</span>
            <h2 className="section-title" style={{ marginTop: 8 }}>Notre mission</h2>
            <p className="ap-section-desc">
              Le Comité Culturel Islamique (CCI) de l'École Supérieure Polytechnique (ESP) est
              une organisation étudiante dédiée à la promotion de la culture islamique et à
              l'accès au savoir religieux pour tous les étudiants.
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
              <span className="eyebrow">Notre collection</span>
              <h2 className="section-title" style={{ marginTop: 8 }}>La bibliothèque</h2>
              <div className="gold-line" />
              <p className="ap-lib-desc">
                La bibliothèque du CCI met à disposition de nombreux ouvrages islamiques en
                langue <strong>française</strong>, <strong>arabe</strong> et <strong>wolof</strong>.
                Elle est ouverte à tous les membres de la communauté ESP.
              </p>
              <ul className="ap-lib-features">
                <li><span>✦</span> Ouvrages en français, arabe et wolof</li>
                <li><span>✦</span> Emprunts gratuits pour les membres</li>
                <li><span>✦</span> Durée d'emprunt : 1 mois renouvelable</li>
                <li><span>✦</span> Livre de la semaine sélectionné par le comité</li>
              </ul>
              <Link to="/catalogue" className="btn btn-gold" style={{ marginTop: 24 }}>
                Parcourir le catalogue →
              </Link>
            </div>

            {/* Grille catégories */}
            <div className="ap-cat-grid ap-reveal">
              {COLLECTION_CATS.map((cat, i) => (
                <Link to="/catalogue" className="ap-cat-item card" key={i}>
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
              { value: `${stats.totalBooks}+`,    label: 'Ouvrages disponibles', icon: <BookMarked size={20} /> },
              { value: '3',                       label: 'Langues',              icon: <Globe size={20} /> },
              { value: '1 mois', label: 'Durée d\'emprunt max',    icon: <ClipboardList size={20} /> },
              { value: stats.weeklyBook ? '1' : '0', label: 'Livre de la semaine', icon: <Star size={20} /> },
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
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} style={{ color: 'var(--gold)' }} /> Informations pratiques</h3>
              <ul className="ap-contact-list">
                <li>
                  <span className="ap-contact-key">Lieu</span>
                  <span>Salle CCI, École Supérieure Polytechnique, Dakar</span>
                </li>
                <li>
                  <span className="ap-contact-key">Horaires</span>
                  <span>Lundi — Vendredi : 9h00 – 19h00</span>
                </li>
                <li>
                  <span className="ap-contact-key">Email</span>
                  <a href="mailto:routaydev@gmail.com" className="ap-contact-link">
                    routaydev@gmail.com
                  </a>
                </li>
                <li>
                  <span className="ap-contact-key">Téléphone</span>
                  <a href="tel:+221784290065" className="ap-contact-link">+221 78 429 00 65</a>
                </li>
              </ul>
            </div>

            {/* Citation */}
            <div className="ap-citation-card ap-reveal">
              <div className="ap-citation-arabic">
                إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ
              </div>
              <p className="ap-citation-trans">
                « Parmi les serviteurs d'Allah, seuls les savants Le craignent vraiment. »
              </p>
              <p className="ap-citation-ref">Sourate Fâtir — Verset 28</p>
              <div className="ap-citation-actions">
                <Link to="/emprunts" className="btn btn-gold btn-sm">Emprunter un livre</Link>
                <Link to="/catalogue" className="btn btn-glass btn-sm">Voir le catalogue</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}