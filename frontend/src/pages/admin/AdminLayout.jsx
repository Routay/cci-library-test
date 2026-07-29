import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, Star,
  LogOut, FileText, Shield, Sun, Moon, Settings, UserCog, Landmark, HeartHandshake,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import CCI_LOGO from '../../assets/logo.png';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate           = useNavigate();
  const location           = useLocation();

  const NAV = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard'            },
    { to: '/admin/livres',    icon: <BookOpen size={18} />,         label: 'Livres'               },
    { to: '/admin/emprunts',  icon: <ClipboardList size={18} />,    label: 'Emprunts'             },
    { to: '/admin/membres',   icon: <Users size={18} />,            label: 'Membres'              },
    { to: '/admin/semaine',   icon: <Star size={18} />,             label: 'Livre de la semaine'  },
    { to: '/admin/grands-hommes', icon: <Landmark size={18} />,      label: 'Grands Hommes'        },
  ];

  const SUPER_NAV = [
    { to: '/admin/gestion-admins', icon: <UserCog size={18} />,  label: 'Gestion Admins'     },
    { to: '/admin/donations',      icon: <HeartHandshake size={18} />, label: 'Dons (Bénévoles)' },
    { to: '/admin/logs',           icon: <FileText size={18} />, label: "Journal d'Activité" },
    { to: '/admin/parametres',     icon: <Settings size={18} />, label: 'Paramètres'         },
  ];

  const allNav = admin?.role === 'super_admin' ? [...NAV, ...SUPER_NAV] : NAV;

  const handleLogout = () => { logout(); navigate('/admin'); };

  const activeItem  = allNav.find(n => location.pathname.startsWith(n.to));
  const activeLabel = activeItem?.label || 'Admin';

  return (
    <div className="admin-shell">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <aside className="admin-sidebar">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img src={CCI_LOGO} alt="Logo CCI" className="sidebar-logo" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-title">CCI Admin</span>
            <span className="sidebar-sub">Bibliothèque ESP</span>
          </div>
        </div>

        {/* Info admin */}
        <div className="sidebar-admin-info">
          <div className="admin-avatar">
            {admin?.prenom?.charAt(0)?.toUpperCase() || 'A'}
            {admin?.nom?.charAt(0)?.toUpperCase() || ''}
          </div>
          <div className="sidebar-admin-details">
            <p className="admin-name">{admin?.prenom} {admin?.nom}</p>
            <p className="admin-role">
              {admin?.role === 'super_admin' ? (
                <span className="role-badge role-super">
                  <Shield size={9} /> Super Admin
                </span>
              ) : (
                <span className="role-badge role-admin">Admin</span>
              )}
            </p>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {location.pathname.startsWith(item.to) && <span className="sidebar-active-pip" />}
            </NavLink>
          ))}

          {/* Section Super Admin */}
          {admin?.role === 'super_admin' && (
            <>
              <div className="sidebar-section-label">
                <Shield size={10} />
                <span>Super Admin</span>
              </div>
              {SUPER_NAV.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link sidebar-link-super ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                  {location.pathname.startsWith(item.to) && <span className="sidebar-active-pip sidebar-pip-super" />}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Séparateur */}
        <div className="sidebar-divider" />

        {/* Déconnexion */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-icon"><LogOut size={18} /></span>
          <span>Déconnexion</span>
        </button>
      </aside>

      {/* ─── MAIN ────────────────────────────────────── */}
      <div className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="topbar-breadcrumb">
              <span className="topbar-breadcrumb-root">Admin</span>
              <span className="topbar-breadcrumb-sep">/</span>
              <span className="topbar-breadcrumb-page">{activeLabel}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Toggle dark / light */}
            <button
              className="topbar-theme-btn"
              onClick={toggle}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Changer le thème"
            >
              {theme === 'dark'
                ? <Sun size={16} strokeWidth={2} />
                : <Moon size={16} strokeWidth={2} />}
            </button>

            {/* Badge utilisateur */}
            <div className="topbar-user">
              <div className="topbar-user-avatar">
                {admin?.prenom?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="topbar-user-name">{admin?.prenom} {admin?.nom}</span>
            </div>
          </div>
        </header>

        {/* Contenu des sous-pages */}
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}