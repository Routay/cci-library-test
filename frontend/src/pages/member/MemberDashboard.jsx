import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, PlusCircle, MessageSquare, Handshake, LogOut,
  User, ChevronRight, Gift, BarChart3
} from 'lucide-react';
import axios from 'axios';
import MyDonations from './MyDonations';
import NewDonation from './NewDonation';
import Messaging from './Messaging';
import Partnership from './Partnership';
import './MemberDashboard.css';
import './MemberPages.css';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MIN_DONATIONS_FOR_PARTNERSHIP = 2;

export default function MemberDashboard() {
  const { admin: user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [donationCount, setDonationCount] = useState(0);
  const location = useLocation();
  const { t } = useTranslation();

  // Récupérer le nombre de dons de l'utilisateur
  useEffect(() => {
    const fetchDonationCount = async () => {
      try {
        const { data } = await axios.get(`${API}/api/donations/my-donations`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDonationCount(data.length);
      } catch (err) {
        console.error('Erreur récupération nombre de dons:', err);
      }
    };
    if (user?.token) fetchDonationCount();
  }, [user]);

  const navLinks = [
    { to: '/dashboard/mes-dons',     icon: BookOpen,       label: t('dashboard.nav_my_donations'),     desc: t('dashboard.nav_my_donations_desc') },
    { to: '/dashboard/nouveau-don',  icon: PlusCircle,     label: t('dashboard.nav_new_donation'), desc: t('dashboard.nav_new_donation_desc') },
    { to: '/dashboard/messagerie',   icon: MessageSquare,  label: t('dashboard.nav_messaging'),   desc: t('dashboard.nav_messaging_desc') },
    // Partenariat visible uniquement après 2 dons minimum
    ...(donationCount >= MIN_DONATIONS_FOR_PARTNERSHIP ? [
      { to: '/dashboard/partenariat',  icon: Handshake,      label: t('dashboard.nav_partnership'),  desc: t('dashboard.nav_partnership_desc') },
    ] : []),
  ];

  const activeLink = navLinks.find(l => location.pathname.startsWith(l.to));
  const activeLabel = activeLink?.label || 'Tableau de bord';

  const initials = `${user?.prenom?.charAt(0) || ''}${user?.nom?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="member-layout">
      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div className="member-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={`member-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Profil */}
        <div className="ms-profile">
          <div className="ms-avatar">{initials}</div>
          <div className="ms-profile-info">
            <h3 className="ms-user-name">{user?.prenom} {user?.nom}</h3>
            <span className="ms-user-role">
              <Gift size={12} /> {t('dashboard.sidebar_role')}
            </span>
          </div>
        </div>

        <div className="ms-divider" />

        {/* Navigation */}
        <nav className="ms-nav">
          <span className="ms-nav-label">{t('dashboard.sidebar_menu_title')}</span>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `ms-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="ms-nav-icon-wrap">
                <link.icon size={18} />
              </span>
              <span className="ms-nav-text">
                <span className="ms-nav-link-label">{link.label}</span>
                <span className="ms-nav-link-desc">{link.desc}</span>
              </span>
              <ChevronRight size={14} className="ms-nav-chevron" />
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="ms-sidebar-bottom">
          <div className="ms-divider" />
          <button
            className="ms-logout-btn"
            onClick={() => { logout(); window.location.href = '/login'; }}
          >
            <LogOut size={18} />
            <span>{t('dashboard.sidebar_logout')}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────── */}
      <div className="member-main">
        <header className="ms-topbar">
          <div className="ms-topbar-left">
            <button className="ms-burger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span /><span /><span />
            </button>
            <div className="ms-breadcrumb">
              <span className="ms-breadcrumb-root">{t('dashboard.breadcrumb_root')}</span>
              <ChevronRight size={14} />
              <span className="ms-breadcrumb-page">{activeLabel}</span>
            </div>
          </div>
          <div className="ms-topbar-right">
            <div className="ms-topbar-avatar">{initials}</div>
          </div>
        </header>

        <div className="member-content">
          <Routes>
            <Route index element={<Navigate to="mes-dons" replace />} />
            <Route path="mes-dons" element={<MyDonations />} />
            <Route path="nouveau-don" element={<NewDonation />} />
            <Route path="messagerie" element={<Messaging />} />
            {donationCount >= MIN_DONATIONS_FOR_PARTNERSHIP ? (
              <Route path="partenariat" element={<Partnership />} />
            ) : (
              <Route path="partenariat" element={<Navigate to="mes-dons" replace />} />
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}

