import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Handshake, CheckCircle, Clock, XCircle, Rocket, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Partnership() {
  const { admin: user } = useAuth();
  const [status, setStatus] = useState(user?.partnerStatus || 'none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStatus(res.data.partnerStatus);
        
        // Mise à jour de la session pour la persistance
        if (user.partnerStatus !== res.data.partnerStatus) {
          const updatedUser = { ...user, partnerStatus: res.data.partnerStatus };
          sessionStorage.setItem('cci_user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du statut :", err);
      }
    };
    fetchStatus();
  }, [user]);

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API}/api/users/partner-request`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStatus('pending');
      const updatedUser = { ...user, partnerStatus: 'pending' };
      sessionStorage.setItem('cci_user', JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.response?.data?.message || t('partnership.error_request'));
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: ShieldCheck, title: t('partnership.benefit1_title'), desc: t('partnership.benefit1_desc') },
    { icon: Handshake, title: t('partnership.benefit2_title'), desc: t('partnership.benefit2_desc') },
    { icon: Rocket, title: t('partnership.benefit3_title'), desc: t('partnership.benefit3_desc') },
  ];

  return (
    <div className="md-page">
      <div className="md-page-header">
        <div>
          <h2 className="md-page-title">{t('partnership.title')}</h2>
          <p className="md-page-subtitle">{t('partnership.subtitle')}</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="md-partner-status-card">
        {status === 'approved' ? (
          <>
            <div className="md-partner-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <CheckCircle size={40} />
            </div>
            <h3>{t('partnership.status_approved_title')}</h3>
            <p>{t('partnership.status_approved_desc')}</p>
          </>
        ) : status === 'pending' ? (
          <>
            <div className="md-partner-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              <Clock size={40} />
            </div>
            <h3>{t('partnership.status_pending_title')}</h3>
            <p>{t('partnership.status_pending_desc')}</p>
          </>
        ) : status === 'rejected' ? (
          <>
            <div className="md-partner-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <XCircle size={40} />
            </div>
            <h3>{t('partnership.status_rejected_title')}</h3>
            <p>{t('partnership.status_rejected_desc')}</p>
          </>
        ) : (
          <>
            <div className="md-partner-icon" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>
              <Handshake size={40} />
            </div>
            <h3>{t('partnership.status_none_title')}</h3>
            <p>{t('partnership.status_none_desc')}</p>
            {error && <p className="md-partner-error">{error}</p>}
            <button className="btn btn-primary" onClick={handleRequest} disabled={loading} style={{ marginTop: 16 }}>
              {loading ? t('partnership.btn_sending') : t('partnership.btn_send_request')}
            </button>
          </>
        )}
      </div>

      {/* Avantages */}
      <h3 className="md-section-title">{t('partnership.benefits_title')}</h3>
      <div className="md-benefits-grid">
        {benefits.map((b, i) => (
          <div key={i} className="md-benefit-card">
            <div className="md-benefit-icon">
              <b.icon size={24} />
            </div>
            <h4>{b.title}</h4>
            <p>{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
