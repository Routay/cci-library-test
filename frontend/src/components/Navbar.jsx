import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { Sun, Moon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CCI_LOGO from '../assets/logo.png';
import './Navbar.css';

const LINKS = [
  { path: '/',              labelKey: 'nav.library'    },
  { path: '/catalogue',    labelKey: 'nav.catalog'           },
  { path: '/livre-semaine',labelKey: 'nav.bookOfWeek' },
  { path: '/apropos',      labelKey: 'nav.about'            },
  { path: '/benevoles',    labelKey: 'nav.volunteers'           },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [langOpen,  setLangOpen]  = useState(false);
  const { theme, toggle }         = useTheme();
  const location                  = useLocation();
  const { t, i18n }               = useTranslation();

  const langs = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
  ];

  /* Scroll detect */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* Fermer le menu au changement de route */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Bloquer le scroll quand le menu est ouvert */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-topline" />
      <div className="navbar-inner container">

        {/* ── Brand ── */}
        <Link to="/" className="nav-brand clickable" onClick={() => setMenuOpen(false)}>
          <img
            src={CCI_LOGO}
            alt="Logo CCI — Comité Culturel Islamique"
            className="nav-logo"
          />
          <div className="nav-brand-text">
            <span className="nav-brand-name">CCI</span>
            <span className="nav-brand-sub">Bibliothèque · ESP</span>
          </div>
        </Link>

        {/* ── Liens desktop ── */}
        <nav className="nav-links" aria-label="Navigation principale">
          {LINKS.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`nav-link clickable ${location.pathname === l.path ? 'active' : ''}`}
            >
              {t(l.labelKey)}
              {location.pathname === l.path && <span className="nav-active-dot" />}
            </Link>
          ))}
        </nav>

        {/* ── Droite ── */}
        <div className="nav-right">
          
          {/* Sélecteur de langue */}
          <div 
            className="lang-selector-wrap clickable"
            onMouseEnter={() => setLangOpen(true)}
            onMouseLeave={() => setLangOpen(false)}
          >
            <div className="lang-toggle">
              <Globe size={16} className="lang-icon" />
              <span className="lang-current">{i18n.language.toUpperCase()}</span>
            </div>
            
            <div className={`lang-dropdown ${langOpen ? 'open' : ''}`}>
              {langs.map(l => (
                <button 
                  key={l.code} 
                  className={`lang-option clickable ${i18n.language === l.code ? 'active' : ''}`}
                  onClick={() => {
                    i18n.changeLanguage(l.code);
                    setLangOpen(false);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="theme-btn clickable"
            onClick={toggle}
            aria-label="Changer le thème"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Bouton hamburger mobile */}
          <button
            className={`hamburger clickable ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="ham-bar" />
            <span className="ham-bar" />
            <span className="ham-bar" />
          </button>
        </div>
      </div>

      {/* ── Menu mobile drawer ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="mobile-nav">
          {LINKS.map(l => (
            <Link
              key={l.path}
              to={l.path}
              className={`mobile-link clickable ${location.pathname === l.path ? 'active' : ''}`}
            >
              {t(l.labelKey)}
            </Link>
          ))}
        </nav>
      </div>

      {/* Overlay sombre derrière le menu */}
      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}