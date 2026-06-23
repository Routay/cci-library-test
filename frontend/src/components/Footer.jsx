import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import CCI_LOGO from '../assets/logo.png';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
            <div className="footer-brand">
              <img src={CCI_LOGO} alt="Logo CCI" className="footer-logo" />
              <div>
                <div className="footer-brand-name">CCI</div>
                <div className="footer-brand-sub">Comité Culturel Islamique — ESP</div>
              </div>
            </div>
            <p className="footer-desc">Accès au savoir islamique pour tous les membres de la communauté ESP de Dakar.</p>
          </div>

          <div>
            <div className="footer-col-title">Navigation</div>
            <div className="footer-links">
              <Link to="/"               className="footer-link clickable">La bibliothèque</Link>
              <Link to="/catalogue"      className="footer-link clickable">Catalogue</Link>
              <Link to="/livre-semaine"  className="footer-link clickable">Livre de la semaine</Link>
              <Link to="/apropos"        className="footer-link clickable">À propos</Link>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Contact</div>
            <p className="footer-contact-item"><Mail size={14} style={{ color: 'var(--gold)' }} /> routaydev@gmail.com</p>
            <p className="footer-contact-item"><MapPin size={14} style={{ color: 'var(--gold)' }} /> ESP, Dakar, Sénégal</p>
            <p className="footer-contact-item"><Phone size={14} style={{ color: 'var(--gold)' }} /> +221 78 429 00 65</p>
            <p className="footer-contact-item"><Clock size={14} style={{ color: 'var(--gold)' }} /> Lun–Ven : 9h – 19h</p>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Comité Culturel Islamique ESP — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}