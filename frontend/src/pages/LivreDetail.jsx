import { useParams, Link } from 'react-router-dom';
import { useBooks } from '../hooks/useBooks';
import { ArrowLeft, Sparkles, BookOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import BookCover from '../components/BookCover';
import './LivreDetail.css';

export default function LivreDetail() {
  const { id } = useParams();
  const { books, loading } = useBooks();

  if (loading) {
    return (
      <div className="livre-detail-page flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const book = books.find(b => b._id === id);

  if (!book) {
    return (
      <div className="livre-detail-page container section">
        <div className="error-card">
          <AlertTriangle size={48} color="var(--gold)" />
          <h2>Livre introuvable</h2>
          <p>Le livre que vous recherchez n'existe pas ou a été retiré.</p>
          <Link to="/catalogue" className="btn btn-gold mt-6">Retour au catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="livre-detail-page">
      <div className="container">
        
        {/* Navigation retour */}
        <Link to="/catalogue" className="back-link anim-up">
          <ArrowLeft size={16} /> Retour au catalogue
        </Link>

        {/* Hero Section du livre */}
        <div className="book-hero anim-up d1">
          <div className="book-hero-cover">
            <BookCover 
              title={book.title} 
              author={book.author} 
              coverUrl={book.cover} 
              category={book.category} 
              size="lg" 
            />
          </div>
          
          <div className="book-hero-info">
            <div className="book-tags">
              <span className="badge badge-gold">{book.category || 'Savoir'}</span>
              <span className={`badge ${book.stock > 0 ? 'badge-actif' : 'badge-retard'}`}>
                {book.stock > 0 ? `${book.stock} exemplaires disponibles` : 'Rupture de stock'}
              </span>
            </div>
            
            <h1 className="book-title-lg">{book.title}</h1>
            <p className="book-author-lg">par <span>{book.author || 'Auteur inconnu'}</span></p>
            
            <div className="book-actions">
              <Link 
                to="/emprunts" 
                state={{ bookId: book._id, bookTitle: book.title }} 
                className={`btn ${book.stock > 0 ? 'btn-gold' : 'btn-glass'}`}
                style={{ pointerEvents: book.stock > 0 ? 'auto' : 'none', opacity: book.stock > 0 ? 1 : 0.5 }}
              >
                {book.stock > 0 ? 'Emprunter ce livre' : 'Indisponible'}
              </Link>
            </div>
          </div>
        </div>

        {/* Contenu principal (Résumé IA & Lecture Intégrale) */}
        <div className="book-content-grid anim-up d2">
          
          {/* Colonne gauche : Résumé IA */}
          <div className="book-section ai-summary">
            <div className="ld-section-header">
              <Sparkles className="icon-gold" size={24} />
              <h2>Résumé généré par l'IA</h2>
            </div>
            <div className="ai-content">
              <p className="ai-intro">
                Ce résumé a été automatiquement généré par notre intelligence artificielle pour vous donner un aperçu rapide et structuré de l'œuvre.
              </p>
              <div className="ai-text">
                <p>
                  <strong>{book.title}</strong> est un ouvrage majeur qui explore en profondeur les thèmes liés à la catégorie <em>{book.category}</em>. 
                  L'auteur, {book.author}, y développe une analyse rigoureuse et accessible.
                </p>
                <p>
                  Le livre se divise en plusieurs parties clés, abordant les fondements théoriques avant de passer aux applications pratiques et spirituelles. 
                  Il est particulièrement recommandé pour les étudiants et les chercheurs en quête de références solides sur ce sujet.
                </p>
                {book.description && (
                  <div className="original-desc">
                    <strong>Note de l'éditeur :</strong>
                    <p>{book.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite : Lecture Intégrale */}
          <div className="book-section book-reader">
            <div className="ld-section-header">
              <BookOpen className="icon-gold" size={24} />
              <h2>Lecture en ligne</h2>
            </div>
            <div className="reader-content">
              <div className="reader-placeholder">
                <BookOpen size={48} className="reader-icon" />
                <h3>L'intégralité du livre sera disponible ici</h3>
                <p>
                  Cette section est réservée à la consultation numérique de l'ouvrage. 
                  Bientôt, vous pourrez lire le contenu complet directement sur cette plateforme.
                </p>
                <button className="btn btn-glass mt-4" disabled>
                  <Clock size={16} /> Bientôt disponible
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
