import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Eye, AlertCircle, Calendar, Mail, Phone, BookOpen, Clock, Gift, Search, ZoomIn, ZoomOut, X, ShieldCheck, ShieldX, AlertTriangle, BookPlus, MessageSquare, Download } from 'lucide-react';
import api from '../../services/api';
import PdfReader from '../../components/PdfReader';
import './AdminDonations.css';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(100);
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

      {/* ══════════════════════════════════════════════════════
           MODAL — LECTEUR PDF IMMERSIF
           ══════════════════════════════════════════════════════ */}
      {viewPdfUrl && (
        <div className="don-pdf-overlay" onClick={() => { setViewPdfUrl(null); setPdfZoom(100); }}>
          <div className="don-pdf-modal" onClick={e => e.stopPropagation()}>
            {/* Floating top bar */}
            <div className="don-pdf-topbar">
              <div className="don-pdf-topbar-left">
                <div className="don-pdf-topbar-icon">
                  <FileText size={18} />
                </div>
                <span className="don-pdf-topbar-title">Lecteur de document</span>
              </div>
              <div className="don-pdf-topbar-center">
                <button
                  className="don-pdf-zoom-btn"
                  onClick={() => setPdfZoom(z => Math.max(z - 25, 50))}
                  disabled={pdfZoom <= 50}
                  title="Zoom arrière"
                >
                  <ZoomOut size={16} />
                </button>
                <div className="don-pdf-zoom-display">
                  <span>{pdfZoom}%</span>
                </div>
                <button
                  className="don-pdf-zoom-btn"
                  onClick={() => setPdfZoom(z => Math.min(z + 25, 300))}
                  disabled={pdfZoom >= 300}
                  title="Zoom avant"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
              <div className="don-pdf-topbar-right">
                <a
                  href={viewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="don-pdf-download-btn"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <Download size={16} />
                </a>
                <button className="don-pdf-close-btn" onClick={() => { setViewPdfUrl(null); setPdfZoom(100); }} title="Fermer">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* PDF Content */}
            <div className="don-pdf-content">
              <PdfReader url={viewPdfUrl} zoom={pdfZoom} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           MODAL — CONFIRMATION APPROBATION
           ══════════════════════════════════════════════════════ */}
      {confirmStatus && confirmStatus.status === 'approved' && (
        <div className="don-confirm-overlay" onClick={() => setConfirmStatus(null)}>
          <div className="don-confirm-modal don-confirm-approve" onClick={e => e.stopPropagation()}>
            <button className="don-confirm-close" onClick={() => setConfirmStatus(null)}>
              <X size={18} />
            </button>
            <div className="don-confirm-visual">
              <div className="don-confirm-icon-ring don-ring-approve">
                <div className="don-confirm-icon-inner">
                  <ShieldCheck size={32} />
                </div>
              </div>
              <div className="don-confirm-sparkle don-sparkle-1" />
              <div className="don-confirm-sparkle don-sparkle-2" />
              <div className="don-confirm-sparkle don-sparkle-3" />
            </div>
            <h3 className="don-confirm-title">Approuver ce don ?</h3>
            <p className="don-confirm-desc">
              En approuvant, un <strong>nouveau livre</strong> sera automatiquement créé dans le catalogue public et sera accessible à tous les membres.
            </p>
            <div className="don-confirm-info-card don-info-approve">
              <BookPlus size={18} />
              <span>Le livre apparaîtra dans le catalogue après validation.</span>
            </div>
            <div className="don-confirm-actions">
              <button className="don-confirm-btn don-btn-cancel" onClick={() => setConfirmStatus(null)}>
                Annuler
              </button>
              <button className="don-confirm-btn don-btn-approve" onClick={executeStatusUpdate}>
                <CheckCircle size={16} />
                Approuver le don
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           MODAL — CONFIRMATION REJET
           ══════════════════════════════════════════════════════ */}
      {confirmStatus && confirmStatus.status === 'rejected' && (
        <div className="don-confirm-overlay" onClick={() => setConfirmStatus(null)}>
          <div className="don-confirm-modal don-confirm-reject" onClick={e => e.stopPropagation()}>
            <button className="don-confirm-close" onClick={() => setConfirmStatus(null)}>
              <X size={18} />
            </button>
            <div className="don-confirm-visual">
              <div className="don-confirm-icon-ring don-ring-reject">
                <div className="don-confirm-icon-inner">
                  <ShieldX size={32} />
                </div>
              </div>
            </div>
            <h3 className="don-confirm-title">Rejeter ce don ?</h3>
            <p className="don-confirm-desc">
              Le bénévole sera notifié du rejet. Vous pouvez préciser un motif pour l'aider à comprendre la décision.
            </p>
            <div className="don-confirm-textarea-wrap">
              <label className="don-confirm-textarea-label">
                <MessageSquare size={14} />
                Motif du rejet <span className="don-confirm-optional">(visible par le bénévole)</span>
              </label>
              <textarea
                className="don-confirm-textarea"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ex: Le contenu ne correspond pas aux critères de la bibliothèque, format incompatible..."
              />
            </div>
            <div className="don-confirm-actions">
              <button className="don-confirm-btn don-btn-cancel" onClick={() => setConfirmStatus(null)}>
                Annuler
              </button>
              <button className="don-confirm-btn don-btn-reject" onClick={executeStatusUpdate}>
                <XCircle size={16} />
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
