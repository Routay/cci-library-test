import { useState, useEffect } from 'react';
import { settingsAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Building2, BookOpenCheck, Bell, ShieldCheck,
  Save, CheckCircle, RefreshCw, XCircle,
  Clock, Hash, RotateCcw, Mail, MapPin, Phone,
} from 'lucide-react';
import './AdminParametres.css';

function Spinner() {
  return (
    <div className="dash-spinner-wrap">
      <div className="dash-spinner" />
    </div>
  );
}

export default function AdminParametres() {
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Sécurité — changement mot de passe
  const [pwdData, setPwdData]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError]   = useState('');

  useEffect(() => {
    settingsAPI.get()
      .then(({ data }) => setSettings(data))
      .catch(() => toast.error('Erreur chargement paramètres'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await settingsAPI.update(settings);
      setSettings(data);
      setSaved(true);
      toast.success('Paramètres sauvegardés');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError('');
    if (!pwdData.newPassword || pwdData.newPassword.length < 6) {
      setPwdError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (pwdData.newPassword !== pwdData.confirm) {
      setPwdError('Les mots de passe ne correspondent pas');
      return;
    }
    setPwdSaving(true);
    try {
      await adminAPI.changeOwnPwd({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });
      setPwdData({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Mot de passe modifié avec succès');
    } catch (e) {
      setPwdError(e.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <div className="settings-page"><Spinner /></div>;
  if (!settings) return <div className="settings-page"><p>Impossible de charger les paramètres.</p></div>;

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Paramètres Système</h1>
          <p className="admin-date">Configuration globale — Super Admin</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {saved && (
            <span className="saved-badge">
              <CheckCircle size={16} /> Sauvegardé
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* ═══ Informations Bibliothèque ═══ */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="settings-section-title">Informations Bibliothèque</h3>
              <p className="settings-section-sub">Nom, description et coordonnées</p>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-field">
              <label>Nom de la bibliothèque</label>
              <input
                type="text"
                value={settings.libraryName || ''}
                onChange={e => update('libraryName', e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label>Description</label>
              <textarea
                value={settings.libraryDescription || ''}
                onChange={e => update('libraryDescription', e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label>Horaires d'ouverture</label>
              <input
                type="text"
                value={settings.openingHours || ''}
                onChange={e => update('openingHours', e.target.value)}
                placeholder="Lun-Ven : 08h00 — 18h00"
              />
            </div>
            <div className="settings-field">
              <label>Adresse</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={e => update('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ═══ Règles d'Emprunt ═══ */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(184,146,42,0.12)', color: 'var(--gold)' }}>
              <BookOpenCheck size={20} />
            </div>
            <div>
              <h3 className="settings-section-title">Règles d'Emprunt</h3>
              <p className="settings-section-sub">Durée, limites et renouvellements</p>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-field-row">
              <div className="settings-field">
                <label><Clock size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Durée d'emprunt (jours)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.loanDurationDays || 14}
                  onChange={e => update('loanDurationDays', parseInt(e.target.value) || 14)}
                />
              </div>
              <div className="settings-field">
                <label><Hash size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Max emprunts / membre</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxLoansPerMember || 3}
                  onChange={e => update('maxLoansPerMember', parseInt(e.target.value) || 3)}
                />
              </div>
            </div>

            <div className="settings-field">
              <label>Pénalité de retard (FCFA / jour)</label>
              <input
                type="number"
                min="0"
                value={settings.penaltyPerDay || 0}
                onChange={e => update('penaltyPerDay', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">Autoriser les renouvellements</span>
                <span className="settings-toggle-hint">Les membres peuvent prolonger leur emprunt</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowRenewals ?? true}
                  onChange={e => update('allowRenewals', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {settings.allowRenewals && (
              <div className="settings-field">
                <label><RotateCcw size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Nombre max de renouvellements</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={settings.maxRenewals || 1}
                  onChange={e => update('maxRenewals', parseInt(e.target.value) || 1)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ Notifications ═══ */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 className="settings-section-title">Notifications</h3>
              <p className="settings-section-sub">E-mails et rappels automatiques</p>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">
                  <Mail size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
                  Rappels avant échéance
                </span>
                <span className="settings-toggle-hint">Envoyer un email de rappel avant la date de retour</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailReminders ?? true}
                  onChange={e => update('emailReminders', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {settings.emailReminders && (
              <div className="settings-field">
                <label>Jours avant échéance pour le rappel</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={settings.reminderDaysBefore || 2}
                  onChange={e => update('reminderDaysBefore', parseInt(e.target.value) || 2)}
                />
              </div>
            )}

            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">Confirmation d'emprunt</span>
                <span className="settings-toggle-hint">Email de confirmation quand un emprunt est validé</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailOnLoanConfirm ?? true}
                  onChange={e => update('emailOnLoanConfirm', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="settings-toggle">
              <div className="settings-toggle-info">
                <span className="settings-toggle-label">Alerte de retard</span>
                <span className="settings-toggle-hint">Notification quand un emprunt dépasse la date limite</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailOnOverdue ?? true}
                  onChange={e => update('emailOnOverdue', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* ═══ Contact & Informations publiques ═══ */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(14,165,233,0.12)', color: '#0EA5E9' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="settings-section-title">Contact & Informations publiques</h3>
              <p className="settings-section-sub">Ces informations sont visibles sur les pages publiques (Footer, À propos)</p>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="settings-field-row">
              <div className="settings-field">
                <label><Mail size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Email de contact</label>
                <input
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={e => update('contactEmail', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="settings-field">
                <label><Phone size={11} style={{ display: 'inline', verticalAlign: -1 }} /> Téléphone</label>
                <input
                  type="text"
                  value={settings.contactPhone || ''}
                  onChange={e => update('contactPhone', e.target.value)}
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
            </div>
            <div className="settings-field">
              <label>Description du footer (page publique)</label>
              <textarea
                value={settings.footerDescription || ''}
                onChange={e => update('footerDescription', e.target.value)}
                placeholder="Description courte affichée dans le pied de page..."
              />
            </div>
          </div>
        </div>

        {/* ═══ Sécurité ═══ */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="settings-section-title">Sécurité</h3>
              <p className="settings-section-sub">Changer votre mot de passe</p>
            </div>
          </div>
          <div className="settings-section-body">
            <div className="security-current-info">
              <div className="security-avatar">
                {admin?.prenom?.charAt(0)?.toUpperCase() || 'S'}{admin?.nom?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="security-info">
                <span className="security-name">{admin?.prenom} {admin?.nom}</span>
                <span className="security-email">{admin?.email}</span>
              </div>
            </div>

            {pwdError && (
              <div className="form-error-banner">
                <XCircle size={14} /> {pwdError}
              </div>
            )}

            <div className="settings-field">
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={pwdData.currentPassword}
                onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                placeholder="Entrez votre mot de passe actuel"
              />
            </div>
            <div className="settings-field">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={pwdData.newPassword}
                onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                placeholder="Min. 6 caractères"
              />
            </div>
            <div className="settings-field">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={pwdData.confirm}
                onChange={e => setPwdData({ ...pwdData, confirm: e.target.value })}
                placeholder="Répétez le mot de passe"
              />
            </div>
            <button
              className="btn btn-outline"
              onClick={handlePasswordChange}
              disabled={pwdSaving}
              style={{ alignSelf: 'flex-start' }}
            >
              <ShieldCheck size={16} />
              {pwdSaving ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>

        {/* Save bar */}
        <div className="settings-save-bar">
          {saved && (
            <span className="saved-badge">
              <CheckCircle size={16} /> Modifications sauvegardées
            </span>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
          </button>
        </div>
      </div>
    </div>
  );
}
