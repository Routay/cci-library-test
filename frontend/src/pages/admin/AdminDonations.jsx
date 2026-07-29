import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './AdminDashboard.css';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [viewPdfUrl, setViewPdfUrl] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);

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
  };

  const executeStatusUpdate = async () => {
    if (!confirmStatus) return;
    try {
      await api.patch(`/api/donations/${confirmStatus.id}/status`, { status: confirmStatus.status });
      fetchDonations();
      setConfirmStatus(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setConfirmStatus(null);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dons de livres (Bénévoles)</h1>
        <p>Validez les ouvrages proposés par la communauté. Les dons approuvés créent automatiquement un livre dans le catalogue public.</p>
      </div>

      {error && (
        <div className="admin-alert error">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
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
            {donations.map((d) => (
              <tr key={d._id}>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td>
                  <strong>{d.donorName}</strong><br />
                  <span className="text-sm text-gray">{d.donorEmail}</span>
                  {d.donorPhone && <><br /><span className="text-sm text-gray">{d.donorPhone}</span></>}
                </td>
                <td>
                  <strong>{d.bookTitle}</strong><br />
                  <span className="text-sm text-gray">par {d.author}</span>
                  {d.description && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', padding: '8px', background: 'var(--bg1)', borderRadius: '4px' }}>
                      <em>Note : {d.description}</em>
                    </div>
                  )}
                </td>
                <td>
                  <button className="row-btn" onClick={() => setViewPdfUrl(d.pdfUrl)} title="Lire le PDF">
                    <Eye size={16} />
                  </button>
                </td>
                <td>
                  {d.status === 'pending' && <span className="badge" style={{background: '#f59e0b', color: '#fff'}}>En attente</span>}
                  {d.status === 'approved' && <span className="badge badge-actif">Approuvé</span>}
                  {d.status === 'rejected' && <span className="badge badge-retard">Rejeté</span>}
                </td>
                <td>
                  {d.status === 'pending' && (
                    <div className="row-actions">
                      <button className="row-btn" style={{ color: '#22c55e' }} onClick={() => handleUpdateStatus(d._id, 'approved')} title="Approuver & Créer le livre">
                        <CheckCircle size={16} />
                      </button>
                      <button className="row-btn row-btn-del" onClick={() => handleUpdateStatus(d._id, 'rejected')} title="Rejeter">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Aucun don proposé pour le moment.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View PDF */}
      {viewPdfUrl && (
        <div className="modal-overlay" onClick={() => setViewPdfUrl(null)}>
          <div className="modal-box" style={{ maxWidth: '90vw', height: '95vh', padding: 0, display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px' }}>
              <h2>Aperçu du PDF</h2>
              <button className="modal-close" onClick={() => setViewPdfUrl(null)}>✕</button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe src={`${viewPdfUrl}#toolbar=0`} width="100%" height="100%" style={{ border: 'none', display: 'block' }} title="Aperçu PDF"></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Statut */}
      {confirmStatus && (
        <div className="modal-overlay" onClick={() => setConfirmStatus(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmer l'action</h2>
              <button className="modal-close" onClick={() => setConfirmStatus(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
                Êtes-vous sûr de vouloir <strong>{confirmStatus.status === 'approved' ? 'approuver' : 'rejeter'}</strong> ce don ?
                {confirmStatus.status === 'approved' && " Un nouveau livre sera automatiquement créé dans le catalogue public."}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmStatus(null)}>Annuler</button>
              <button 
                className={`btn ${confirmStatus.status === 'approved' ? 'btn-primary' : 'btn-danger'}`} 
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
