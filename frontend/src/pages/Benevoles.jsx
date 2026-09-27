import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BookOpen, ShieldCheck, Heart, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import './Benevoles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Benevoles() {
  const { t } = useTranslation();
  const { isAuth, admin, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleBecomeBenevole = async () => {
    try {
      setLoading(true);
      const token = admin?.token || sessionStorage.getItem('cci_token');
      const { data } = await axios.put(`${API}/api/auth/become-benevole`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateUser({ isBenevole: true });
      setSuccessMsg("Félicitations, vous êtes maintenant bénévole !");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        alert("Votre session a expiré ou est invalide. Veuillez vous reconnecter.");
      } else {
        alert(err.response?.data?.message || "Erreur lors de l'opération.");
      }
    } finally {
      setLoading(false);
    }
  };

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
              admin?.isBenevole ? (
                <Link to="/dashboard" className="btn-primary ben-btn">
                  Accéder au dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <button onClick={handleBecomeBenevole} disabled={loading} className="btn-primary ben-btn">
                  {loading ? <Loader2 size={18} className="spin" /> : "Devenir Bénévole maintenant"} <ArrowRight size={18} />
                </button>
              )
            ) : (
              <Link to="/login?type=benevole" className="btn-primary ben-btn">
                {t('benevoles.hero_btn_no_auth')} <ArrowRight size={18} />
              </Link>
            )}
            {successMsg && <p style={{color: '#10b981', marginTop: '10px', fontWeight: 'bold'}}>{successMsg}</p>}
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
                admin?.isBenevole ? (
                  <Link to="/dashboard" className="btn-primary ben-btn">Accéder au dashboard</Link>
                ) : (
                  <button onClick={handleBecomeBenevole} disabled={loading} className="btn-primary ben-btn">
                    {loading ? <Loader2 size={18} className="spin" /> : "Devenir Bénévole"}
                  </button>
                )
              ) : (
                <>
                  <Link to="/login?type=benevole" className="btn-primary ben-btn">{t('benevoles.cta_btn_register')}</Link>
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
