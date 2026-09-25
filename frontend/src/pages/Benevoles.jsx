import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BookOpen, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import './Benevoles.css';

export default function Benevoles() {
  const { t } = useTranslation();
  const { isAuth } = useAuth();

  return (
    <div className="benevoles-page" style={{ marginTop: 'var(--nav-h)' }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="ben-hero">
        <div className="ben-hero-overlay" />
        <div className="container ben-hero-content">
          <div className="ben-hero-badge">{t('benevoles.hero_badge')}</div>
          <h1>{t('benevoles.hero_title')}</h1>
          <p>{t('benevoles.hero_desc')}</p>
          
          <div className="ben-hero-actions">
            {isAuth ? (
              <Link to="/dashboard" className="btn-primary ben-btn">
                {t('benevoles.hero_btn_auth')} <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/login" className="btn-primary ben-btn">
                {t('benevoles.hero_btn_no_auth')} <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Explications ─────────────────────────────────── */}
      <section className="ben-info section container">
        <div className="ben-section-header">
          <h2>{t('benevoles.why_title')}</h2>
          <div className="ben-divider" />
        </div>
        
        <div className="ben-features">
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><BookOpen size={28} /></div>
            <h3>{t('benevoles.feature1_title')}</h3>
            <p>{t('benevoles.feature1_desc')}</p>
          </div>
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><ShieldCheck size={28} /></div>
            <h3>{t('benevoles.feature2_title')}</h3>
            <p>{t('benevoles.feature2_desc')}</p>
          </div>
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><Heart size={28} /></div>
            <h3>{t('benevoles.feature3_title')}</h3>
            <p>{t('benevoles.feature3_desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Call to Action ───────────────────────────────── */}
      <section className="ben-cta-section container" style={{ paddingBottom: 100 }}>
        <div className="ben-cta-card">
          <div className="ben-cta-content">
            <h2>{t('benevoles.cta_title')}</h2>
            <p>{t('benevoles.cta_desc')}</p>
            
            <div className="ben-cta-buttons">
              {isAuth ? (
                <Link to="/dashboard" className="btn-primary ben-btn">{t('benevoles.cta_btn_auth')}</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary ben-btn">{t('benevoles.cta_btn_register')}</Link>
                  <Link to="/login" className="btn-outline ben-btn">{t('benevoles.cta_btn_login')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
