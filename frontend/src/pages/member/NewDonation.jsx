import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Upload, CheckCircle, AlertCircle, FileText, BookOpen, UserCircle, Type, User, AlignLeft, Phone } from 'lucide-react';
import './NewDonation.css'; // Let's use a specific CSS for this
import { useTranslation, Trans } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function NewDonation() {
  const { admin: user } = useAuth();
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    donorPhone: user?.tel || '',
    bookTitle: '',
    author: '',
    description: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file && file.type !== 'application/pdf') {
      setError(t('newDonation.file_error', 'Le fichier doit être un PDF.'));
      setPdfFile(null);
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setError(t('newDonation.file_required'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('pdfFile', pdfFile);

      await axios.post(`${API}/api/donations`, data, {
        headers: { Authorization: `Bearer ${user.token}` },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess(true);
      setFormData({ donorPhone: user?.tel || '', bookTitle: '', author: '', description: '' });
      setPdfFile(null);
    } catch (err) {
      setError(err.response?.data?.message || t('newDonation.submit_error'));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (success) {
    return (
      <div className="md-page">
        <div className="md-success-state premium-card">
          <div className="md-success-icon pulse-animation">
            <CheckCircle size={56} />
          </div>
          <h2>{t('newDonation.success_title')}</h2>
          <p>
            <Trans i18nKey="newDonation.success_desc">
              Votre livre a bien été enregistré et est en <strong>attente de validation</strong>. L'équipe examinera votre proposition dans les plus brefs délais.
            </Trans>
          </p>
          <button className="btn btn-primary" onClick={() => setSuccess(false)}>
            {t('newDonation.btn_another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md-page" style={{ paddingBottom: '40px' }}>
      <div className="md-page-header">
        <div>
          <h2 className="md-page-title">{t('newDonation.title')}</h2>
          <p className="md-page-subtitle">{t('newDonation.subtitle')}</p>
        </div>
      </div>

      <div className="premium-form-container">
        <form onSubmit={handleSubmit} className="premium-form">
          {error && (
            <div className="md-alert md-alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Colonne Gauche : Infos */}
            <div className="form-column">
              <div className="premium-section-header">
                <div className="icon-badge"><BookOpen size={20} /></div>
                <h3>{t('newDonation.section_info')}</h3>
              </div>

              <div className="premium-input-group">
                <label>{t('newDonation.label_title')} <span className="md-required">*</span></label>
                <div className="input-wrapper">
                  <Type size={18} className="input-icon" />
                  <input type="text" name="bookTitle" value={formData.bookTitle} onChange={handleChange} placeholder={t('newDonation.placeholder_title')} required />
                </div>
              </div>

              <div className="premium-input-group">
                <label>{t('newDonation.label_author')} <span className="md-required">*</span></label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input type="text" name="author" value={formData.author} onChange={handleChange} placeholder={t('newDonation.placeholder_author')} required />
                </div>
              </div>

              <div className="premium-input-group">
                <label>{t('newDonation.label_desc')} <span className="md-optional">{t('newDonation.optional')}</span></label>
                <div className="input-wrapper textarea-wrapper">
                  <AlignLeft size={18} className="input-icon top-icon" />
                  <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder={t('newDonation.placeholder_desc')}></textarea>
                </div>
              </div>

              <div className="premium-section-header mt-4">
                <div className="icon-badge"><UserCircle size={20} /></div>
                <h3>{t('newDonation.section_contact')}</h3>
              </div>

              <div className="premium-input-group">
                <label>{t('newDonation.label_phone')} <span className="md-optional">{t('newDonation.optional')}</span></label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input type="tel" name="donorPhone" value={formData.donorPhone} onChange={handleChange} placeholder={t('newDonation.placeholder_phone')} />
                </div>
              </div>
            </div>

            {/* Colonne Droite : Fichier */}
            <div className="form-column">
              <div className="premium-section-header">
                <div className="icon-badge"><FileText size={20} /></div>
                <h3>{t('newDonation.section_file', 'Fichier PDF (Obligatoire)')}</h3>
              </div>
              
              <div 
                className={`premium-upload-zone ${dragActive ? 'drag-active' : ''} ${pdfFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="application/pdf" 
                  onChange={handleFileChange} 
                  required 
                  style={{ display: 'none' }} 
                />
                
                {pdfFile ? (
                  <div className="file-success-view">
                    <div className="file-icon-large">
                      <FileText size={48} />
                      <div className="check-badge"><CheckCircle size={20} /></div>
                    </div>
                    <div className="file-details">
                      <span className="file-name">{pdfFile.name}</span>
                      <span className="file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} Mo</span>
                    </div>
                    <button type="button" className="btn-change-file" onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}>
                      {t('newDonation.change_file')}
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <div className="upload-icon-circle">
                      <Upload size={32} />
                    </div>
                    <h4>{t('newDonation.drag_drop')}</h4>
                    <p>{t('newDonation.or_browse')}</p>
                    <span className="upload-limit">{t('newDonation.max_size')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            {loading && (
              <div style={{ width: '100%', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--txt2)' }}>Envoi du fichier en cours...</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gold)' }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}
            <button type="submit" className="btn-primary submit-donation-btn" disabled={loading} style={{ width: '100%' }}>
              {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><div className="loader-spinner" style={{ width: 16, height: 16 }} /> Traitement...</span> : t('newDonation.btn_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
