import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Eye, AlertCircle, Calendar, Mail, Phone, BookOpen, Clock, Gift, Search } from 'lucide-react';
import api from '../../services/api';
import './AdminDonations.css';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchDonations = async () => {
    try {
      const res = await api.get('/api/donations');
      setDonations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des dons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleUpdateStatus = (id, status) => {
    setConfirmStatus({ id, status });
    setRejectionReason('');
  };

  const executeStatusUpdate = async () => {
    if (!confirmStatus) return;
    try {
      const payload = { status: confirmStatus.status };
      if (confirmStatus.status === 'rejected') {
        payload.rejectionReason = rejectionReason;
      }
      await api.patch(`/api/donations/${confirmStatus.id}/status`, payload);
      fetchDonations();
      setConfirmStatus(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setConfirmStatus(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const filteredDonations = donations.filter(d => {
    const matchSearch = `${d.donorName} ${d.donorEmail} ${d.bookTitle} ${d.author}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: donations.length,
    pending: donations.filter(d => d.status === 'pending').length,
    approved: donations.filter(d => d.status === 'approved').length,
    rejected: donations.filter(d => d.status === 'rejected').length,
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-page donations-page-modern">

      {/* ── HEADER ──────────────────────────────────── */}
      <div className="don-hero">
        <div className="don-hero-content">
          <div className="don-hero-icon">
            <Gift size={28} />
          </div>
          <div>
            <h1>Dons de livres</h1>
            <p>Validez les ouvrages proposés par la communauté. Les dons approuvés créent automatiquement un livre dans le catalogue.</p>
          </div>
        </div>
        <div className="don-hero-stats">
          <div className="don-stat">
            <span className="don-stat-val">{stats.total}</span>
            <span className="don-stat-label">Total</span>
          </div>
          <div className="don-stat-divider"></div>
          <div className="don-stat">
            <span className="don-stat-val don-stat-pending">{stats.pending}</span>
            <span className="don-stat-label">En attente</span>
          </div>
          <div className="don-stat-divider"></div>
          <div className="don-stat">
            <span className="don-stat-val don-stat-approved">{stats.approved}</span>
            <span className="don-stat-label">Approuvés</span>
          </div>
          <div className="don-stat-divider"></div>
          <div className="don-stat">
            <span className="don-stat-val don-stat-rejected">{stats.rejected}</span>
            <span className="don-stat-label">Rejetés</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-alert error" style={{ marginBottom: 24 }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* ── CONTROLS ────────────────────────────────── */}
      <div className="don-controls">
        <div className="don-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, email, titre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="don-filters">
          <button className={`don-filter ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
            Tous
          </button>
          <button className={`don-filter ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
            <Clock size={14} /> En attente
          </button>
          <button className={`don-filter ${filterStatus === 'approved' ? 'active' : ''}`} onClick={() => setFilterStatus('approved')}>
            <CheckCircle size={14} /> Approuvés
          </button>
          <button className={`don-filter ${filterStatus === 'rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('rejected')}>
            <XCircle size={14} /> Rejetés
          </button>
        </div>
      </div>

      {/* ── TABLE ───────────────────────────────────── */}
      <div className="don-table-card">
        <div className="don-table-wrap">
          <table className="don-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bénévole</th>
                <th>Livre (Titre & Auteur)</th>
                <th>Fichier</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((d, i) => (
                <tr key={d._id} style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <span className="don-td-date">
                      <Calendar size={13} />
                      {new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    <div className="don-td-donor">
                      <div className="don-td-avatar">{getInitials(d.donorName)}</div>
                      <div className="don-td-donor-info">
                        <span className="don-td-name">{d.donorName}</span>
                        <span className="don-td-email">{d.donorEmail}</span>
                        {d.donorPhone && <span className="don-td-phone">{d.donorPhone}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="don-td-book">
                      <span className="don-td-book-title">{d.bookTitle}</span>
                      <span className="don-td-book-author">par {d.author}</span>
                      {d.description && (
                        <div className="don-td-book-note">
                          <em>Note : {d.description}</em>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <button className="don-td-pdf-btn" onClick={() => setViewPdfUrl(d.pdfUrl)} title="Lire le PDF">
                      <Eye size={16} />
                    </button>
                  </td>
                  <td>
                    {d.status === 'pending' && (
                      <span className="don-badge don-badge-pending"><Clock size={12} /> En attente</span>
                    )}
                    {d.status === 'approved' && (
                      <span className="don-badge don-badge-approved"><CheckCircle size={12} /> Approuvé</span>
                    )}
                    {d.status === 'rejected' && (
                      <span className="don-badge don-badge-rejected"><XCircle size={12} /> Rejeté</span>
                    )}
                  </td>
                  <td>
                    {d.status === 'pending' && (
                      <div className="don-td-actions">
                        <button className="don-action-btn don-action-approve" onClick={() => handleUpdateStatus(d._id, 'approved')} title="Approuver & Créer le livre">
                          <CheckCircle size={16} />
                        </button>
                        <button className="don-action-btn don-action-reject" onClick={() => handleUpdateStatus(d._id, 'rejected')} title="Rejeter">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan="6" className="don-td-empty">
                    <BookOpen size={32} />
                    <span>Aucun don trouvé.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View PDF */}
      {viewPdfUrl && (
        <div className="donation-modal-overlay" onClick={() => setViewPdfUrl(null)}>
          <div className="donation-modal pdf-modal-content" onClick={e => e.stopPropagation()}>
            <div className="donation-modal-header">
              <h2>Aperçu du PDF</h2>
              <button className="donation-modal-close" onClick={() => setViewPdfUrl(null)}>✕</button>
            </div>
            <iframe src={`${viewPdfUrl}#toolbar=0`} width="100%" title="Aperçu PDF"></iframe>
          </div>
        </div>
      )}

      {/* Modal Confirmation Statut */}
      {confirmStatus && (
        <div className="donation-modal-overlay" onClick={() => setConfirmStatus(null)}>
          <div className="donation-modal" style={{ width: '480px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="donation-modal-header">
              <h2>Confirmer l'action</h2>
              <button className="donation-modal-close" onClick={() => setConfirmStatus(null)}>✕</button>
            </div>
            <div className="donation-modal-body">
              <p>
                Êtes-vous sûr de vouloir <strong>{confirmStatus.status === 'approved' ? 'approuver' : 'rejeter'}</strong> ce don ?
                {confirmStatus.status === 'approved' && " Un nouveau livre sera automatiquement créé dans le catalogue public."}
              </p>
              
              {confirmStatus.status === 'rejected' && (
                <div>
                  <label style={{ display: 'block', marginTop: 16, marginBottom: 8, color: 'var(--txt1)', fontWeight: 600, fontSize: '0.9rem' }}>
                    Motif du rejet (visible par le bénévole) :
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Ex: Le livre est trop abîmé, ou hors sujet..."
                  />
                </div>
              )}
            </div>
            <div className="donation-modal-footer">
              <button className="don-modal-btn don-modal-btn-cancel" onClick={() => setConfirmStatus(null)}>Annuler</button>
              <button 
                className={`don-modal-btn ${confirmStatus.status === 'approved' ? 'don-modal-btn-approve' : 'don-modal-btn-reject'}`} 
                onClick={executeStatusUpdate}
              >
                {confirmStatus.status === 'approved' ? 'Oui, approuver' : 'Oui, rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
