import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function Admin() {
  return (
    <div style={{ marginTop: 'var(--nav-h)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: '56px 48px', textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '3rem', marginBottom: 20, display: 'flex', justifyContent: 'center' }}><Lock size={48} strokeWidth={1.5} style={{ color: 'var(--gold)' }} /></div>
        <h2 style={{ marginBottom: 12 }}>Espace Administration</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
          L'espace admin sera disponible une fois le backend Node.js connecté.
          Il permettra de gérer les livres, emprunts et membres.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-outline">← Retour à l'accueil</Link>
          <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>Se connecter</button>
        </div>
      </div>
    </div>
  );
}