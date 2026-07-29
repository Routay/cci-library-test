import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { booksAPI, loansAPI, settingsAPI } from '../services/api';
import { MapPin, Phone, BookOpen, CheckCircle } from 'lucide-react';
import './Emprunts.css';

export default function Emprunts() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialBookId = location.state?.bookId || searchParams.get('bookId') || '';

  const [form, setForm]        = useState({ 
    nom: '', prenom: '', email: '', tel: '', bookId: initialBookId, date: '', note: '',
    etablissement: '', sexe: '', departement: '', logeCampus: false, chambre: ''
  });
  const [submitted, setSubmit] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [books, setBooks]      = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [pubSettings, setPubSettings] = useState(null);

  // Charger les livres disponibles depuis l'API
  useEffect(() => {
    booksAPI.getAll({ limit: 200 })
      .then(({ data }) => setBooks((data.books || []).filter(b => b.stock > 0)))
      .catch(() => setBooks([]))
      .finally(() => setBooksLoading(false));
      
    settingsAPI.getPublic()
      .then(res => setPubSettings(res.data))
      .catch(() => {});
  }, []);

  const handleChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await loansAPI.requestPublic(form);
      setSubmit(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  const selectedBook = books.find(b => b._id === form.bookId);

  if (submitted) {
    return (
      <div className="emprunts-page" style={{ marginTop: 'var(--nav-h)' }}>
        <div className="container">
          <div className="success-card card">
            <div className="success-icon"><CheckCircle size={48} strokeWidth={1.5} style={{ color: 'var(--green-mid, #22c55e)' }} /></div>
            <h2>{t('emprunts.success_title')}</h2>
            <p>
              {t('emprunts.success_desc')
                .replace('<1>', '').replace('</1>', '')
                .replace('<2>', '').replace('</2>', '')
                .replace('{{book}}', selectedBook?.title || form.bookId)
                .replace('{{email}}', form.email)
              }
            </p>
            <button className="btn btn-primary" onClick={() => { setSubmit(false); setForm({ nom:'',prenom:'',email:'',tel:'',bookId:'',date:'',note:'',etablissement:'',sexe:'',departement:'',logeCampus:false,chambre:'' }); }}>
              {t('emprunts.success_btn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showUniversityFields = form.etablissement === 'Université' || form.etablissement === 'École de formation';

  return (
    <div className="emprunts-page" style={{ marginTop: 'var(--nav-h)' }}>
      {/* Header */}
      <div className="emprunts-header">
        <div className="container">
          <h1>{t('emprunts.title')}</h1>
          <p>{t('emprunts.sub')}</p>
        </div>
      </div>

      <div className="container">
        <div className="emprunts-layout">
          {/* Form */}
          <form className="emprunt-form card" onSubmit={handleSubmit}>
            <h2>{t('emprunts.info_title')}</h2>
            <p className="form-intro">{t('emprunts.info_required').replace('<1>', '').replace('</1>', '')}</p>

            <div className="form-row">
              <div className="form-field">
                <label>{t('emprunts.label_nom')} <span className="required">*</span></label>
                <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="Diallo" required />
              </div>
              <div className="form-field">
                <label>{t('emprunts.label_prenom')} <span className="required">*</span></label>
                <input type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Moussa" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>{t('emprunts.label_email')} <span className="required">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="moussa@esp.sn" required />
              </div>
              <div className="form-field">
                <label>{t('emprunts.label_tel')}</label>
                <input type="tel" name="tel" value={form.tel} onChange={handleChange} placeholder="+221 78 429 00 65" />
              </div>
            </div>

            <div className="form-field">
              <label>{t('emprunts.label_etablissement')} <span className="required">*</span></label>
              <select name="etablissement" value={form.etablissement} onChange={handleChange} required>
                <option value="">{t('emprunts.select_etablissement')}</option>
                <option value="Université">{t('emprunts.opt_universite')}</option>
                <option value="École de formation">{t('emprunts.opt_ecole')}</option>
                <option value="Institut">{t('emprunts.opt_institut')}</option>
                <option value="Autre">{t('emprunts.opt_autre')}</option>
              </select>
            </div>

            {showUniversityFields && (
              <div className="form-row" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="form-field">
                  <label>{t('emprunts.label_sexe')}</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange}>
                    <option value="">{t('emprunts.select_sexe')}</option>
                    <option value="M">{t('emprunts.opt_m')}</option>
                    <option value="F">{t('emprunts.opt_f')}</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>{t('emprunts.label_dept')}</label>
                  <input type="text" name="departement" value={form.departement} onChange={handleChange} placeholder="Génie Informatique..." />
                </div>
              </div>
            )}

            <div className="form-field checkbox-field" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: form.logeCampus ? 0 : 20 }}>
              <input type="checkbox" id="logeCampus" name="logeCampus" checked={form.logeCampus} onChange={handleChange} style={{ width: 'auto' }} />
              <label htmlFor="logeCampus" style={{ marginBottom: 0 }}>{t('emprunts.label_campus')}</label>
            </div>

            {form.logeCampus && (
              <div className="form-field" style={{ animation: 'fadeIn 0.3s ease-out', marginTop: 15 }}>
                <label>{t('emprunts.label_chambre')} <span className="required">*</span></label>
                <input type="text" name="chambre" value={form.chambre} onChange={handleChange} placeholder="Pavillon A, Chambre 102" required={form.logeCampus} />
              </div>
            )}

            <div className="form-field">
              <label>{t('emprunts.label_livre')} <span className="required">*</span></label>
              {booksLoading ? (
                <select disabled><option>{t('emprunts.loading_books')}</option></select>
              ) : (
                <select name="bookId" value={form.bookId} onChange={handleChange} required>
                  <option value="">{t('emprunts.select_livre')}</option>
                  {books.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.title} — {b.author} ({b.stock} {t('emprunts.dispo')})
                    </option>
                  ))}
                </select>
              )}
              {!booksLoading && books.length === 0 && (
                <p style={{ color: 'var(--txt3)', fontSize: '0.85rem', marginTop: 6 }}>
                  {t('emprunts.no_books')}
                </p>
              )}
            </div>

            <div className="form-field">
              <label>{t('emprunts.label_date')} <span className="required">*</span></label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="form-field">
              <label>{t('emprunts.label_note')}</label>
              <textarea name="note" value={form.note} onChange={handleChange} placeholder={t('emprunts.note_placeholder')} rows={3} />
            </div>

            <button type="submit" className={`btn btn-primary submit-btn ${loading ? 'loading' : ''}`} disabled={loading || booksLoading}>
              {loading ? t('emprunts.sending') : t('emprunts.submit')}
            </button>
          </form>

          {/* Info sidebar */}
          <aside className="emprunt-info">
            <div className="info-card card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} style={{ color: 'var(--gold)' }} /> {t('emprunts.sidebar_info')}</h3>
              <ul>
                <li><strong>{t('emprunts.sidebar_duration')}</strong> : {pubSettings?.loanDurationDays || 30} jours</li>
                <li><strong>{t('emprunts.sidebar_pickup')}</strong> : {pubSettings?.address || 'ESP — salle CCI'}</li>
                <li><strong>{t('emprunts.sidebar_hours')}</strong> : {pubSettings?.openingHours || 'Lun–Ven, 9h–19h'}</li>
              </ul>
            </div>

            <div className="info-card card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} style={{ color: 'var(--gold)' }} /> {t('emprunts.sidebar_contact')}</h3>
              <p>{t('emprunts.sidebar_contact_desc')}</p>
              <p className="info-contact">{pubSettings?.contactEmail || 'routaydev@gmail.com'}</p>
              <p className="info-contact">{pubSettings?.contactPhone || '+221 78 429 00 65'}</p>
            </div>

            <div className="info-card card info-reminder">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} style={{ color: 'var(--gold)' }} /> {t('emprunts.sidebar_reminder')}</h3>
              <p className="arabic-small">إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ</p>
              {t('common.citation_trans') && (
                <p className="quote-trans" style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--txt2)', margin: '8px 0', lineHeight: 1.4 }}>{t('common.citation_trans')}</p>
              )}
              <p className="quote-src">{t('common.citation_ref')}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}