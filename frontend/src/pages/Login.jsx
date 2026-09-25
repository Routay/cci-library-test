import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Mail, Lock, User, Phone, Building, UserCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import CCI_LOGO from '../assets/logo.png';
import './Login.css'; 

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    tel: '',
    etablissement: '',
    sexe: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard'); 
      } else {
        const { data } = await axios.post(`${API}/api/auth/register`, formData);
        sessionStorage.setItem('cci_token', data.token);
        sessionStorage.setItem('cci_user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.err_default'));
    } finally {
      setLoading(false);
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

        <h2>{isLogin ? t('login.title_login') : t('login.title_register')}</h2>
        <p className="login-subtitle">
          {isLogin ? t('login.sub_login') : t('login.sub_register')}
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
    </div>
  );
}
