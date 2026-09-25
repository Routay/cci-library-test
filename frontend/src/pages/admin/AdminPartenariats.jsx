import React, { useState, useEffect } from 'react';
import { Handshake, CheckCircle, XCircle, Clock, Search, AlertCircle, TrendingUp, Mail, Building, Phone, Calendar, Users, ShieldCheck, ShieldX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AdminPartenariats.css';

function Spinner() { return <div className="dash-spinner-wrap"><div className="dash-spinner" /></div>; }

export default function AdminPartenariats() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data.users);
    } catch (err) {
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/api/users/${userId}/partner-status`, { partnerStatus: newStatus });
      toast.success('Statut du partenariat mis à jour avec succès');
      setUsers(users.map(u => u._id === userId ? { ...u, partnerStatus: newStatus } : u));
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const partnershipUsers = users.filter(u => u.partnerStatus && u.partnerStatus !== 'none');

  const filteredUsers = partnershipUsers.filter(u => {
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filter === 'all' || u.partnerStatus === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    pending: partnershipUsers.filter(u => u.partnerStatus === 'pending').length,
    approved: partnershipUsers.filter(u => u.partnerStatus === 'approved').length,
    rejected: partnershipUsers.filter(u => u.partnerStatus === 'rejected').length,
    all: partnershipUsers.length,
  };

  if (loading) return <div className="partenariats-page"><Spinner /></div>;

  return (
    <div className="partenariats-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Partenariats Bénévoles</h1>
          <p className="admin-date">{partnershipUsers.length} demande{partnershipUsers.length !== 1 ? 's' : ''} de partenariat</p>
        </div>
        <div className="prt-header-icon">
          <Handshake size={24} />
        </div>
      </div>

      {error && (
        <div className="prt-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="prt-stats-row">
        <div className={`prt-stat-card ${filter === 'all' ? 'prt-stat-active' : ''}`} onClick={() => setFilter('all')}>
          <div className="prt-stat-icon prt-stat-icon-all"><Users size={20} /></div>
          <div className="prt-stat-info">
            <span className="prt-stat-number">{counts.all}</span>
            <span className="prt-stat-label">Total</span>
          </div>
        </div>
        <div className={`prt-stat-card ${filter === 'pending' ? 'prt-stat-active' : ''}`} onClick={() => setFilter('pending')}>
          <div className="prt-stat-icon prt-stat-icon-pending"><Clock size={20} /></div>
          <div className="prt-stat-info">
            <span className="prt-stat-number">{counts.pending}</span>
            <span className="prt-stat-label">En attente</span>
          </div>
        </div>
        <div className={`prt-stat-card ${filter === 'approved' ? 'prt-stat-active' : ''}`} onClick={() => setFilter('approved')}>
          <div className="prt-stat-icon prt-stat-icon-approved"><ShieldCheck size={20} /></div>
          <div className="prt-stat-info">
            <span className="prt-stat-number">{counts.approved}</span>
            <span className="prt-stat-label">Approuvés</span>
          </div>
        </div>
        <div className={`prt-stat-card ${filter === 'rejected' ? 'prt-stat-active' : ''}`} onClick={() => setFilter('rejected')}>
          <div className="prt-stat-icon prt-stat-icon-rejected"><ShieldX size={20} /></div>
          <div className="prt-stat-info">
            <span className="prt-stat-number">{counts.rejected}</span>
            <span className="prt-stat-label">Refusés</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="prt-toolbar">
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="results-count">{filteredUsers.length} résultat{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cards Grid */}
      <div className="prt-grid">
        {filteredUsers.length === 0 && (
          <div className="prt-empty">
            <div className="prt-empty-icon">
              <Handshake size={40} />
            </div>
            <h3>Aucune demande trouvée</h3>
            <p>Aucun partenariat ne correspond à vos critères de recherche.</p>
          </div>
        )}

        {filteredUsers.map((user, i) => (
          <div key={user._id} className="prt-card" style={{ animationDelay: `${i * 0.06}s` }}>
            {/* Card Top: Status Ribbon */}
            <div className={`prt-card-ribbon prt-ribbon-${user.partnerStatus}`}>
              {user.partnerStatus === 'pending' && <><Clock size={13} /> En attente</>}
              {user.partnerStatus === 'approved' && <><CheckCircle size={13} /> Partenaire actif</>}
              {user.partnerStatus === 'rejected' && <><XCircle size={13} /> Refusé</>}
            </div>

            {/* Profile Section */}
            <div className="prt-card-profile">
              <div className="prt-avatar">
                {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
              </div>
              <div className="prt-card-identity">
                <h3 className="prt-card-name">{user.prenom} {user.nom}</h3>
                <div className="prt-card-detail">
                  <Mail size={13} /> <span>{user.email}</span>
                </div>
                {user.tel && (
                  <div className="prt-card-detail">
                    <Phone size={13} /> <span>{user.tel}</span>
                  </div>
                )}
                {user.etablissement && (
                  <div className="prt-card-detail prt-detail-gold">
                    <Building size={13} /> <span>{user.etablissement}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="prt-card-stats">
              <div className="prt-card-stat">
                <TrendingUp size={15} className="prt-card-stat-icon" />
                <div>
                  <span className="prt-card-stat-val">{user.loanStats?.total || 0}</span>
                  <span className="prt-card-stat-label">Emprunts</span>
                </div>
              </div>
              <div className="prt-card-stat-sep" />
              <div className="prt-card-stat">
                <AlertCircle size={15} className="prt-card-stat-icon prt-stat-icon-warn" />
                <div>
                  <span className={`prt-card-stat-val ${(user.loanStats?.retard || 0) > 0 ? 'prt-val-danger' : ''}`}>
                    {user.loanStats?.retard || 0}
                  </span>
                  <span className="prt-card-stat-label">Retards</span>
                </div>
              </div>
              <div className="prt-card-stat-sep" />
              <div className="prt-card-stat">
                <Calendar size={15} className="prt-card-stat-icon" />
                <div>
                  <span className="prt-card-stat-val prt-val-date">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                  </span>
                  <span className="prt-card-stat-label">Inscrit</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="prt-card-actions">
              {user.partnerStatus === 'pending' && (
                <>
                  <button className="prt-btn prt-btn-approve" onClick={() => handleUpdateStatus(user._id, 'approved')}>
                    <CheckCircle size={15} /> Approuver
                  </button>
                  <button className="prt-btn prt-btn-reject" onClick={() => handleUpdateStatus(user._id, 'rejected')}>
                    <XCircle size={15} /> Refuser
                  </button>
                </>
              )}

              {user.partnerStatus === 'approved' && (
                <button className="prt-btn prt-btn-revoke" onClick={() => handleUpdateStatus(user._id, 'none')}>
                  <XCircle size={15} /> Révoquer le partenariat
                </button>
              )}

              {user.partnerStatus === 'rejected' && (
                <button className="prt-btn prt-btn-neutral" onClick={() => handleUpdateStatus(user._id, 'pending')}>
                  <Clock size={15} /> Remettre en attente
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
