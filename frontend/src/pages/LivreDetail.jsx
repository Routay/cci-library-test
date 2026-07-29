import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBooks } from '../hooks/useBooks';
import { ArrowLeft, Sparkles, BookOpen, Clock, AlertTriangle, X, CheckCircle } from 'lucide-react';
import BookCover from '../components/BookCover';
import './LivreDetail.css';

export default function LivreDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { books, loading } = useBooks();
  
  const [activeImage, setActiveImage] = useState('front'); // 'front' or 'back'
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReaderModal, setShowReaderModal] = useState(false);

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
          <h2>{t('livreDetail.notFound_title')}</h2>
          <p>{t('livreDetail.notFound_desc')}</p>
          <Link to="/catalogue" className="btn btn-gold mt-6">{t('livreDetail.backCatalog')}</Link>
        </div>
      </div>
    );
  }

  const frontCover = book.frontCoverImage || book.cover;
  const backCover = book.backCoverImage;
  const hasBackCover = !!backCover;
  const currentImage = activeImage === 'front' ? frontCover : backCover;

  return (
    <div className="livre-detail-page">
      <div className="container">
        
        {/* Navigation retour */}
        <Link to="/catalogue" className="back-link anim-up">
          <ArrowLeft size={16} /> {t('livreDetail.backCatalog')}
        </Link>

        {/* Hero Section du livre */}
        <div className="book-hero anim-up d1">
          
          {/* Galerie d'images */}
          <div className="book-gallery">
            <div className="book-gallery-main">
              {currentImage ? (
                <img src={currentImage} alt={book.title} className="gallery-main-img" />
              ) : (
                <BookCover 
                  title={book.title} 
                  author={book.author} 
                  coverUrl={book.cover} 
                  category={book.category} 
                  size="lg" 
                />
              )}
            </div>
            
            {hasBackCover && (
              <div className="book-gallery-thumbnails">
                <button 
                  className={`thumbnail-btn ${activeImage === 'front' ? 'active' : ''}`}
                  onClick={() => setActiveImage('front')}
                >
                  <img src={frontCover} alt={t('livreSemaine.frontCover')} />
                </button>
                <button 
                  className={`thumbnail-btn ${activeImage === 'back' ? 'active' : ''}`}
                  onClick={() => setActiveImage('back')}
                >
                  <img src={backCover} alt={t('livreSemaine.backCover')} />
                </button>
              </div>
            )}
          </div>
          
          <div className="book-hero-info">
            <div className="book-tags">
              <span className="badge badge-gold">{book.category || t('livreDetail.knowledge')}</span>
              <span className={`badge ${book.stock > 0 ? 'badge-actif' : 'badge-retard'}`}>
                {book.stock > 0 ? t('livreDetail.stock', { count: book.stock }) : t('common.outOfStock')}
              </span>
            </div>
            
            <h1 className="book-title-lg">{book.title}</h1>
            <p className="book-author-lg">{t('livreDetail.by')} <span>{book.author || t('livreDetail.unknownAuthor')}</span></p>
            
            <div className="book-actions-group">
              <button 
                className="btn btn-glass action-btn" 
                onClick={() => setShowSummaryModal(true)}
              >
                <Sparkles size={20} /> {t('livreDetail.readSummary')}
              </button>
              
              <button 
                className="btn btn-glass action-btn"
                style={{ opacity: book.pdfUrl ? 1 : 0.5, pointerEvents: book.pdfUrl ? 'auto' : 'none' }}
                onClick={() => setShowReaderModal(true)}
              >
                <BookOpen size={20} /> {book.pdfUrl ? t('livreDetail.readOnline') : t('livreDetail.pdfUnavailable')}
              </button>
              
              <Link 
                to="/emprunts" 
                state={{ bookId: book._id, bookTitle: book.title }} 
                className={`btn action-btn ${book.stock > 0 ? 'btn-gold' : 'btn-glass'}`}
                style={{ pointerEvents: book.stock > 0 ? 'auto' : 'none', opacity: book.stock > 0 ? 1 : 0.5 }}
              >
                <CheckCircle size={20} /> {book.stock > 0 ? t('livreDetail.borrowBook') : t('common.unavailable')}
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Synthèse Analytique */}
      {showSummaryModal && (
        <div className="ld-modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="ld-modal-content" onClick={e => e.stopPropagation()}>
            <button className="ld-modal-close" onClick={() => setShowSummaryModal(false)}>
              <X size={24} />
            </button>
            <div className="ld-modal-header">
              <Sparkles className="icon-gold" size={32} />
              <h2>{t('livreDetail.summary_title')}</h2>
            </div>
            <div className="ld-modal-body">
              <p className="ai-intro">
                {t('livreDetail.summary_intro')}
              </p>
              <div className="ai-text">
                {book.aiExtractedText ? (
                  <div dangerouslySetInnerHTML={{ __html: book.aiExtractedText }} />
                ) : (
                  <>
                    <h3>{t('livreDetail.p1_title')}</h3>
                    <p>
                      {t('livreDetail.p1_desc')
                        .replace('<1>', '<strong>').replace('</1>', '</strong>')
                        .replace('<2>', '<em>').replace('</2>', '</em>')
                        .replace('{{title}}', book.title)
                        .replace('{{author}}', book.author)
                        .replace('{{category}}', book.category)
                      }
                    </p>
                    
                    <h3>{t('livreDetail.p2_title')}</h3>
                    <ul>
                      <li>{t('livreDetail.p2_li1')}</li>
                      <li>{t('livreDetail.p2_li2')}</li>
                      <li>{t('livreDetail.p2_li3')}</li>
                    </ul>

                    <h3>{t('livreDetail.p3_title')}</h3>
                    <p>
                      {t('livreDetail.p3_desc')}
                    </p>
                  </>
                )}
                {book.description && (
                  <div className="original-desc" style={{ marginTop: '20px' }}>
                    <strong>{t('livreDetail.editor_note')}</strong>
                    <p>{book.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lecture en ligne */}
      {showReaderModal && (
        <div className="ld-modal-overlay" onClick={() => setShowReaderModal(false)}>
          <div className="ld-modal-content ld-reader-modal" onClick={e => e.stopPropagation()}>
            <button className="ld-modal-close" onClick={() => setShowReaderModal(false)}>
              <X size={24} />
            </button>
            <div className="ld-modal-header">
              <BookOpen className="icon-gold" size={32} />
              <h2>{t('livreDetail.reader_title')}</h2>
            </div>
            <div className="ld-modal-body" style={{ padding: book.pdfUrl ? '0' : '20px', height: book.pdfUrl ? '100%' : 'auto' }}>
              {book.pdfUrl ? (
                <iframe 
                  src={`${book.pdfUrl}#toolbar=0`} 
                  title="Lecteur PDF"
                  width="100%" 
                  height="100%" 
                  style={{ border: 'none', display: 'block' }}
                ></iframe>
              ) : (
                <div className="reader-placeholder" style={{ padding: '20px' }}>
                  <BookOpen size={48} className="reader-icon" />
                  <h3>{t('livreDetail.reader_h3')}</h3>
                  <p>
                    {t('livreDetail.reader_p')}
                  </p>
                  <button className="btn btn-glass mt-4" disabled>
                    <Clock size={16} /> {t('livreDetail.comingSoon')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
