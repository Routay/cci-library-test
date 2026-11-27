import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import { Mail, Lock, User, Phone, Building, UserCircle, Eye, EyeOff, AlertTriangle, ShieldCheck, PartyPopper, Sparkles, Heart } from 'lucide-react';
import CCI_LOGO from '../assets/logo.png';
import './Login.css'; 

// ── Password strength calculator ──────────────────────
function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: 'transparent', segments: [false, false, false, false] };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&.]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Faible', color: '#ef4444', segments: [true, false, false, false] };
  if (score === 3) return { level: 2, label: 'Moyen', color: '#eab308', segments: [true, true, false, false] };
  if (score === 4) return { level: 3, label: 'Bon', color: '#f59e0b', segments: [true, true, true, false] };
  return { level: 4, label: 'Fort', color: '#22c55e', segments: [true, true, true, true] };
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBenevoleFlow = searchParams.get('type') === 'benevole';
  const startOnRegister = searchParams.get('mode') === 'register';
  const { login } = useAuth();
  
  // Start on REGISTER mode if coming from benevole page with mode=register
  const [isLogin, setIsLogin] = useState(!startOnRegister);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Welcome modal state
  const [showWelcome, setShowWelcome] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    tel: '',
    etablissement: '',
    sexe: ''
  });

  // Load remembered email on mount — only in login mode
  useEffect(() => {
    const savedEmail = localStorage.getItem('cci_remember_email');
    if (savedEmail) {
      setRememberMe(true);
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  // When switching modes, clear email if no remembered value
  useEffect(() => {
    if (isLogin) {
      const savedEmail = localStorage.getItem('cci_remember_email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    }
  }, [isLogin]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Save or clear remembered email
        if (rememberMe) {
          localStorage.setItem('cci_remember_email', formData.email);
        } else {
          localStorage.removeItem('cci_remember_email');
        }

        await login(formData.email, formData.password);
        navigate('/dashboard'); 
      } else {
        // Registration validations
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
        if (!passwordRegex.test(formData.password)) {
          setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
          setLoading(false);
          return;
        }

        // Registration — always pass isBenevole based on the flow
        const payload = { ...formData, isBenevole: isBenevoleFlow };
        await authAPI.register(payload);
        
        // Show welcome celebration modal
        setRegisteredName(formData.prenom || formData.nom || '');
        setShowWelcome(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.err_default'));
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    // Switch to login mode and clear ALL fields including email
    setIsLogin(true);
    setFormData({ email: '', password: '', confirmPassword: '', nom: '', prenom: '', tel: '', etablissement: '', sexe: '' });
    setError(null);
    // Restore remembered email if available
    const savedEmail = localStorage.getItem('cci_remember_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  };

  return (
    <div className="login-page">
      {/* Orbes animés en arrière-plan */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-container">
        <div className="login-brand">
          <img src={CCI_LOGO} alt="Logo CCI" className="login-logo-img" />
        </div>

        {/* Benevole flow banner */}
        {isBenevoleFlow && isLogin && (
          <div className="login-benevole-banner">
            <Heart size={16} />
            <span>{t('login.banner_benevole')}</span>
          </div>
        )}

        <h2>{isLogin ? t('login.title_login') : (isBenevoleFlow ? t('login.title_register_benevole') : t('login.title_register'))}</h2>
        <p className="login-subtitle">
          {isLogin 
            ? t('login.sub_login') 
            : (isBenevoleFlow ? t('login.sub_register_benevole') : t('login.sub_register'))}
        </p>

        <div className="login-divider" />

        {error && (
          <div className="login-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group-row">
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input type="text" name="prenom" placeholder={t('login.form_prenom')} value={formData.prenom} onChange={handleChange} required={!isLogin} />
              </div>
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input type="text" name="nom" placeholder={t('login.form_nom')} value={formData.nom} onChange={handleChange} required={!isLogin} />
              </div>
            </div>
          )}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input type="email" name="email" placeholder={t('login.form_email')} value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group-wrap">
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder={t('login.form_pwd')} 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength indicator — only in registration mode */}
            {!isLogin && formData.password && (
              <div className="pwd-strength">
                <div className="pwd-strength-bars">
                  {passwordStrength.segments.map((active, i) => (
                    <div
                      key={i}
                      className={`pwd-strength-segment ${active ? 'active' : ''}`}
                      style={{ backgroundColor: active ? passwordStrength.color : undefined }}
                    />
                  ))}
                </div>
                <span className="pwd-strength-label" style={{ color: passwordStrength.color }}>
                  Force : {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirmPassword" 
                placeholder="Confirmez le mot de passe" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required={!isLogin} 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {!isLogin && (
            <>
              <div className="input-group">
                <Phone size={18} className="input-icon" />
                <input type="tel" name="tel" placeholder={t('login.form_tel')} value={formData.tel} onChange={handleChange} />
              </div>
              <div className="form-group-row">
                <div className="input-group">
                  <Building size={18} className="input-icon" />
                  <select name="etablissement" value={formData.etablissement} onChange={handleChange}>
                    <option value="">{t('login.form_etab')}</option>
                    <option value="Université">{t('login.etab_univ')}</option>
                    <option value="École de formation">{t('login.etab_ecole')}</option>
                    <option value="Institut">{t('login.etab_inst')}</option>
                    <option value="Autre">{t('login.etab_autre')}</option>
                  </select>
                </div>
                <div className="input-group">
                  <UserCircle size={18} className="input-icon" />
                  <select name="sexe" value={formData.sexe} onChange={handleChange}>
                    <option value="">{t('login.form_sexe')}</option>
                    <option value="M">{t('login.sexe_m')}</option>
                    <option value="F">{t('login.sexe_f')}</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Remember Me checkbox — only on login */}
          {isLogin && (
            <label className="login-remember">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => {
                  setRememberMe(e.target.checked);
                  if (!e.target.checked) {
                    localStorage.removeItem('cci_remember_email');
                  }
                }} 
              />
              <span className="login-remember-check" />
              <span>{t('login.remember_me')}</span>
            </label>
          )}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? <div className="login-spinner" /> : (isLogin ? t('login.btn_login') : t('login.btn_register'))}
          </button>
        </form>

        <div className="login-switch">
          <span>{isLogin ? t('login.switch_no_account') : t('login.switch_has_account')}</span>
          <button type="button" className="btn-link" onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? t('login.btn_register') : t('login.btn_login')}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
           WELCOME CELEBRATION MODAL
           ═══════════════════════════════════════════════ */}
      {showWelcome && (
        <div className="welcome-overlay" onClick={handleWelcomeClose}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()}>
            {/* Confetti particles */}
            <div className="welcome-confetti">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="confetti-piece" style={{
                  '--x': `${Math.random() * 100}%`,
                  '--delay': `${Math.random() * 2}s`,
                  '--size': `${6 + Math.random() * 8}px`,
                  '--color': ['#d4af37', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 6)]
                }} />
              ))}
            </div>

            <div className="welcome-icon-pulse">
              <ShieldCheck size={48} />
            </div>

            <h2 className="welcome-title">
              <Sparkles size={24} />
              {t('login.welcome_title', { name: registeredName ? `, ${registeredName}` : '' })}
              <Sparkles size={24} />
            </h2>

            <p className="welcome-text">
              {isBenevoleFlow 
                ? t('login.welcome_benevole')
                : t('login.welcome_normal')
              }
            </p>

            <div className="welcome-info">
              <ShieldCheck size={16} />
              <span>{t('login.welcome_security')}</span>
            </div>

            <button className="welcome-btn" onClick={handleWelcomeClose}>
              <Lock size={18} />
              {t('login.welcome_btn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
