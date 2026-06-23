import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BookCover from './BookCover';

const BookCard = ({ book, index }) => {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div
      className="book-card card animate-fadeUp"
      style={{ animationDelay: `${index * 0.1}s`, display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* ── Couverture professionnelle ── */}
      <Link to={`/livre/${book._id}`} style={{ height: '240px', overflow: 'hidden', borderRadius: '8px 8px 0 0', flexShrink: 0, display: 'block' }}>
        <BookCover
          title={book.title}
          author={book.author}
          coverUrl={book.cover}
          category={book.category}
          size="md"
          style={{ width: '100%', height: '100%', borderRadius: 0, transition: 'transform 0.4s' }}
        />
      </Link>

      <div className="book-info" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div className="book-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-gold">{book.category || 'Savoir'}</span>
          <span style={{ fontSize: '0.78rem', color: book.stock > 0 ? 'var(--gold-l)' : 'var(--txt3)', fontWeight: 600 }}>
            {book.stock > 0 ? `${book.stock} dispo` : 'Rupture'}
          </span>
        </div>
        <h3 className="book-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: 0, color: 'var(--txt1)', lineHeight: 1.3 }}>
          {book.title}
        </h3>
        <p className="book-author" style={{ color: 'var(--txt2)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
          {book.author || 'Auteur inconnu'}
        </p>

        {showSummary && (
          <div className="book-summary animate-fadeIn" style={{ fontSize: '0.82rem', color: 'var(--txt2)', marginTop: '6px', padding: '10px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            {book.description || "Aucun résumé disponible pour cet ouvrage."}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
          <Link to={`/livre/${book._id}`} className="btn btn-glass btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            Voir plus
          </Link>
          <Link
            to="/emprunts"
            state={{ bookId: book._id, bookTitle: book.title }}
            className="btn btn-gold btn-sm"
            style={{ flex: 1, justifyContent: 'center', pointerEvents: book.stock > 0 ? 'auto' : 'none', opacity: book.stock > 0 ? 1 : 0.4 }}
          >
            Emprunter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;