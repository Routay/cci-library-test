import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import CCI_LOGO from '../../assets/logo.png';
import './AdminLogin.css';

export default function AdminLogin() {
  const [form, setForm]    = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]  = useState('');
  const [loading, setLoad] = useState(false);
  const { login, isAuth }  = useAuth();
  const navigate           = useNavigate();

  const getEmailProgress = (email) => {
    if (!email) return { width: '0%', backgroundColor: 'transparent' };
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return isValid ? { width: '100%', backgroundColor: '#22c55e' } : { width: `${Math.min(email.length * 5, 50)}%`, backgroundColor: '#ef4444' };
  };

  const getPasswordProgress = (password) => {
    if (!password) return { width: '0%', backgroundColor: 'transparent' };
    if (password.length < 5) return { width: '33%', backgroundColor: '#ef4444' };
    if (password.length < 8) return { width: '66%', backgroundColor: '#eab308' };
    return { width: '100%', backgroundColor: '#22c55e' };
  };

  console.log('AdminLogin render', { isAuth, pathname: window.location.pathname });

  // Déjà connecté ? Redirige vers le dashboard
  if (isAuth) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoad(true);
    try {
      await login(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="login-page">
      {/* Orbes de fond animés */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-wrap">
            <img src={CCI_LOGO} alt="Logo CCI" className="login-logo-img" />
          </div>
          <div>
            <h1>Espace Admin</h1>
            <p>Bibliothèque CCI — ESP</p>
          </div>
        </div>

        {/* Séparateur gold */}
        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="lf-field">
            <label htmlFor="login-email">Adresse e-mail</label>
            <div className="lf-input-wrap">
              <input
                id="login-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@cci.sn"
                autoComplete="email"
              />
              <div className="input-progress-bar">
                <div className="input-progress-fill" style={getEmailProgress(form.email)} />
              </div>
            </div>
          </div>
          <div className="lf-field">
            <label htmlFor="login-password">Mot de passe</label>
            <div className="lf-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <div className="input-progress-bar">
                <div className="input-progress-fill" style={getPasswordProgress(form.password)} />
              </div>
            </div>
          </div>

          {error && <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} /> {error}</div>}

          <button
            type="submit"
            className="btn btn-gold login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="login-spinner" /> Connexion...</>
            ) : (
              'Se connecter →'
            )}
          </button>
        </form>

        <p className="login-hint">
          <Lock size={14} style={{ color: 'var(--gold)' }} /> Accès réservé aux administrateurs CCI
        </p>
      </div>
    </div>
  );
}