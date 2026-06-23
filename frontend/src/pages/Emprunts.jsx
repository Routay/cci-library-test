import { useState, useEffect } from 'react';
import { booksAPI, loansAPI } from '../services/api';
import { MapPin, Phone, BookOpen, CheckCircle } from 'lucide-react';
import './Emprunts.css';

export default function Emprunts() {
  const [form, setForm]        = useState({ 
    nom: '', prenom: '', email: '', tel: '', bookId: '', date: '', note: '',
    etablissement: '', sexe: '', departement: '', logeCampus: false, chambre: ''
  });
  const [submitted, setSubmit] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [books, setBooks]      = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);

  // Charger les livres disponibles depuis l'API
  useEffect(() => {
    booksAPI.getAll({ limit: 200 })
      .then(({ data }) => setBooks((data.books || []).filter(b => b.stock > 0)))
      .catch(() => setBooks([]))
      .finally(() => setBooksLoading(false));
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
            <h2>Demande envoyée !</h2>
            <p>
              Votre demande d'emprunt pour <strong>«&nbsp;{selectedBook?.title || form.bookId}&nbsp;»</strong> a bien été reçue.
              Nous vous contacterons à <strong>{form.email}</strong> pour confirmer.
            </p>
            <button className="btn btn-primary" onClick={() => { setSubmit(false); setForm({ nom:'',prenom:'',email:'',tel:'',bookId:'',date:'',note:'',etablissement:'',sexe:'',departement:'',logeCampus:false,chambre:'' }); }}>
              Faire une autre demande
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
          <h1>Formulaire d'emprunt</h1>
          <p>Remplissez le formulaire ci-dessous pour emprunter un livre</p>
        </div>
      </div>

      <div className="container">
        <div className="emprunts-layout">
          {/* Form */}
          <form className="emprunt-form card" onSubmit={handleSubmit}>
            <h2>Vos informations</h2>
            <p className="form-intro">Tous les champs marqués <span className="required">*</span> sont obligatoires.</p>

            <div className="form-row">
              <div className="form-field">
                <label>Nom <span className="required">*</span></label>
                <input type="text" name="nom" value={form.nom} onChange={handleChange} placeholder="Diallo" required />
              </div>
              <div className="form-field">
                <label>Prénom <span className="required">*</span></label>
                <input type="text" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Moussa" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Adresse e-mail <span className="required">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="moussa@esp.sn" required />
              </div>
              <div className="form-field">
                <label>Numéro de téléphone</label>
                <input type="tel" name="tel" value={form.tel} onChange={handleChange} placeholder="+221 78 429 00 65" />
              </div>
            </div>

            <div className="form-field">
              <label>Établissement <span className="required">*</span></label>
              <select name="etablissement" value={form.etablissement} onChange={handleChange} required>
                <option value="">— Sélectionnez votre établissement —</option>
                <option value="Université">Université</option>
                <option value="École de formation">École de formation</option>
                <option value="Institut">Institut</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            {showUniversityFields && (
              <div className="form-row" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="form-field">
                  <label>Sexe</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange}>
                    <option value="">— Sélectionner —</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Département / Filière</label>
                  <input type="text" name="departement" value={form.departement} onChange={handleChange} placeholder="Génie Informatique..." />
                </div>
              </div>
            )}

            <div className="form-field checkbox-field" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: form.logeCampus ? 0 : 20 }}>
              <input type="checkbox" id="logeCampus" name="logeCampus" checked={form.logeCampus} onChange={handleChange} style={{ width: 'auto' }} />
              <label htmlFor="logeCampus" style={{ marginBottom: 0 }}>Je loge au campus</label>
            </div>

            {form.logeCampus && (
              <div className="form-field" style={{ animation: 'fadeIn 0.3s ease-out', marginTop: 15 }}>
                <label>Numéro de chambre / Pavillon <span className="required">*</span></label>
                <input type="text" name="chambre" value={form.chambre} onChange={handleChange} placeholder="Pavillon A, Chambre 102" required={form.logeCampus} />
              </div>
            )}

            <div className="form-field">
              <label>Livre souhaité <span className="required">*</span></label>
              {booksLoading ? (
                <select disabled><option>Chargement des livres…</option></select>
              ) : (
                <select name="bookId" value={form.bookId} onChange={handleChange} required>
                  <option value="">— Sélectionnez un livre —</option>
                  {books.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.title} — {b.author} ({b.stock} dispo.)
                    </option>
                  ))}
                </select>
              )}
              {!booksLoading && books.length === 0 && (
                <p style={{ color: 'var(--txt3)', fontSize: '0.85rem', marginTop: 6 }}>
                  Aucun livre disponible pour l'instant.
                </p>
              )}
            </div>

            <div className="form-field">
              <label>Date souhaitée de retrait <span className="required">*</span></label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="form-field">
              <label>Note ou commentaire</label>
              <textarea name="note" value={form.note} onChange={handleChange} placeholder="Un message pour le comité..." rows={3} />
            </div>

            <button type="submit" className={`btn btn-primary submit-btn ${loading ? 'loading' : ''}`} disabled={loading || booksLoading}>
              {loading ? 'Envoi en cours...' : 'Envoyer la demande →'}
            </button>
          </form>

          {/* Info sidebar */}
          <aside className="emprunt-info">
            <div className="info-card card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={16} style={{ color: 'var(--gold)' }} /> Informations pratiques</h3>
              <ul>
                <li><strong>Durée max</strong> : 1 mois</li>
                <li><strong>Renouvellement</strong> : 1 fois possible</li>
                <li><strong>Retrait</strong> : ESP — salle CCI</li>
                <li><strong>Horaires</strong> : Lun–Ven, 9h–19h</li>
              </ul>
            </div>

            <div className="info-card card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} style={{ color: 'var(--gold)' }} /> Contact</h3>
              <p>Un problème ? Contactez-nous directement :</p>
              <p className="info-contact">routaydev@gmail.com</p>
              <p className="info-contact">+221 78 429 00 65</p>
            </div>

            <div className="info-card card info-reminder">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} style={{ color: 'var(--gold)' }} /> Rappel</h3>
              <p className="arabic-small">إِنَّمَا يَخْشَى ٱللَّهَ مِنْ عِبَادِهِ ٱلْعُلَمَٰٓؤُاْ</p>
              <p className="quote-trans" style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--txt2)', margin: '8px 0', lineHeight: 1.4 }}>« Parmi les serviteurs d'Allah, seuls les savants Le craignent vraiment. »</p>
              <p className="quote-src">Sourate Fâtir : 28</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
