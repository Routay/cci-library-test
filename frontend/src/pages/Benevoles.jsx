import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, BookOpen, Heart, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import './Benevoles.css';

export default function Benevoles() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    bookTitle: '',
    author: '',
    description: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'application/pdf') {
      setError(t('benevoles.file_error'));
      setPdfFile(null);
      return;
    }
    setError(null);
    setPdfFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      setError(t('benevoles.submit_error'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('pdfFile', pdfFile);

      await api.post('/api/donations', data);

      setSuccess(true);
      setFormData({
        donorName: '', donorEmail: '', donorPhone: '',
        bookTitle: '', author: '', description: ''
      });
      setPdfFile(null);
    } catch (err) {
      setError(err.response?.data?.message || t('benevoles.send_error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="benevoles-page" style={{ marginTop: 'var(--nav-h)' }}>
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="success-box">
            <CheckCircle size={64} color="var(--gold)" style={{ margin: '0 auto 24px' }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: 16 }}>{t('benevoles.success_title')}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--txt2)', maxWidth: 600, margin: '0 auto' }}>
              {t('benevoles.success_desc')}
            </p>
            <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => setSuccess(false)}>
              {t('benevoles.success_btn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="benevoles-page" style={{ marginTop: 'var(--nav-h)' }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="ben-hero">
        <div className="ben-hero-overlay" />
        <div className="container ben-hero-content">
          <h1>{t('benevoles.hero_title')}</h1>
          <p>{t('benevoles.hero_desc')}</p>
        </div>
      </section>

      {/* ── Explications ─────────────────────────────────── */}
      <section className="ben-info section container">
        <div className="ben-features">
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><BookOpen size={28} /></div>
            <h3>{t('benevoles.feature1_title')}</h3>
            <p>{t('benevoles.feature1_desc')}</p>
          </div>
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><ShieldCheck size={28} /></div>
            <h3>{t('benevoles.feature2_title')}</h3>
            <p>{t('benevoles.feature2_desc')}</p>
          </div>
          <div className="ben-feature-card">
            <div className="ben-icon-wrap"><Heart size={28} /></div>
            <h3>{t('benevoles.feature3_title')}</h3>
            <p>{t('benevoles.feature3_desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Formulaire ───────────────────────────────────── */}
      <section className="ben-form-section container" style={{ paddingBottom: 80 }}>
        <div className="ben-form-wrapper card">
          <div className="ben-form-header">
            <h2>{t('benevoles.form_title')}</h2>
            <p>{t('benevoles.form_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="ben-form">
            {error && (
              <div className="ben-error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group-row">
              <div className="form-group">
                <label>{t('benevoles.label_name')}</label>
                <input type="text" name="donorName" value={formData.donorName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>{t('benevoles.label_email')}</label>
                <input type="email" name="donorEmail" value={formData.donorEmail} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>{t('benevoles.label_phone')}</label>
              <input type="tel" name="donorPhone" value={formData.donorPhone} onChange={handleChange} placeholder={t('benevoles.phone_placeholder')} />
            </div>

            <div className="form-divider" />

            <div className="form-group-row">
              <div className="form-group">
                <label>{t('benevoles.label_bookTitle')}</label>
                <input type="text" name="bookTitle" value={formData.bookTitle} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>{t('benevoles.label_author')}</label>
                <input type="text" name="author" value={formData.author} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>{t('benevoles.label_description')}</label>
              <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder={t('benevoles.desc_placeholder')}></textarea>
            </div>

            <div className="form-group">
              <label>{t('benevoles.label_file')}</label>
              <div className="file-upload-wrapper">
                <input type="file" id="pdfUpload" accept="application/pdf" onChange={handleFileChange} required className="file-upload-input" />
                <label htmlFor="pdfUpload" className="file-upload-label">
                  <Upload size={24} style={{ marginBottom: 8, color: 'var(--gold)' }} />
                  <span className="file-name">{pdfFile ? pdfFile.name : t('benevoles.file_placeholder')}</span>
                  {!pdfFile && <span className="file-hint">{t('benevoles.file_hint')}</span>}
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-submit-don" disabled={loading}>
              {loading ? t('benevoles.sending') : t('benevoles.submit')}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
