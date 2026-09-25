import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Book, CheckCircle, Clock, XCircle, Info, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function MyDonations() {
  const { admin: user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const { data } = await axios.get(`${API}/api/donations/my-donations`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDonations(data);
      } catch (err) {
        console.error("Erreur de récupération des dons", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchDonations();
  }, [user]);

  const statusConfig = {
    approved: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: t('myDonations.status_approved') },
    rejected: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: t('myDonations.status_rejected') },
    pending:  { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: t('myDonations.status_pending') },
  };

  if (loading) {
    return (
      <div className="md-loading">
        <div className="md-spinner" />
        <p>{t('myDonations.loading')}</p>
      </div>
    );
  }

  return (
    <div className="md-page">
      {/* Header */}
      <div className="md-page-header">
        <div>
          <h2 className="md-page-title">{t('myDonations.title')}</h2>
          <p className="md-page-subtitle">{t('myDonations.subtitle')}</p>
        </div>
        <Link to="/dashboard/nouveau-don" className="btn btn-primary md-header-btn">
          <Gift size={18} /> {t('myDonations.btn_donate')}
        </Link>
      </div>

      {/* Stats rapides */}
      <div className="md-stats-row">
        <div className="md-stat-card">
          <div className="md-stat-icon" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)' }}>
            <Book size={20} />
          </div>
          <div className="md-stat-info">
            <span className="md-stat-value">{donations.length}</span>
            <span className="md-stat-label">{t('myDonations.stat_total')}</span>
          </div>
        </div>
        <div className="md-stat-card">
          <div className="md-stat-icon" style={{ background: statusConfig.pending.bg, color: statusConfig.pending.color }}>
            <Clock size={20} />
          </div>
          <div className="md-stat-info">
            <span className="md-stat-value">{donations.filter(d => d.status === 'pending').length}</span>
            <span className="md-stat-label">{t('myDonations.stat_pending')}</span>
          </div>
        </div>
        <div className="md-stat-card">
          <div className="md-stat-icon" style={{ background: statusConfig.approved.bg, color: statusConfig.approved.color }}>
            <CheckCircle size={20} />
          </div>
          <div className="md-stat-info">
            <span className="md-stat-value">{donations.filter(d => d.status === 'approved').length}</span>
            <span className="md-stat-label">{t('myDonations.stat_approved')}</span>
          </div>
        </div>
      </div>

      {/* Liste */}
      {donations.length === 0 ? (
        <div className="md-empty-state">
          <div className="md-empty-icon">
            <Book size={48} />
          </div>
          <h3>{t('myDonations.empty_title')}</h3>
          <p>{t('myDonations.empty_desc')}</p>
          <Link to="/dashboard/nouveau-don" className="btn btn-primary">
            {t('myDonations.empty_btn')} <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="md-donations-list">
          {donations.map((donation) => {
            const cfg = statusConfig[donation.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;

            return (
              <div key={donation._id} className="md-donation-card">
                <div className="md-donation-main">
                  <div className="md-donation-book-icon">
                    <Book size={22} />
                  </div>
                  <div className="md-donation-info">
                    <h4 className="md-donation-title">{donation.bookTitle}</h4>
                    <p className="md-donation-author">{t('myDonations.by_author', { author: donation.author })}</p>
                    <span className="md-donation-date">
                      {t('myDonations.submitted_on', { date: new Date(donation.createdAt).toLocaleDateString(t('lang') === 'ar' ? 'ar-MA' : (t('lang') === 'en' ? 'en-US' : 'fr-FR'), { day: 'numeric', month: 'long', year: 'numeric' }) })}
                    </span>
                  </div>
                  <div className="md-donation-badge" style={{ background: cfg.bg, color: cfg.color }}>
                    <StatusIcon size={16} />
                    {cfg.text}
                  </div>
                </div>

                {donation.status === 'rejected' && donation.rejectionReason && (
                  <div className="md-rejection-banner">
                    <Info size={16} />
                    <div>
                      <strong>{t('myDonations.reject_reason')}</strong> {donation.rejectionReason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
