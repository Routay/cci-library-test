import React, { useState, useEffect } from 'react';
import { useBooks } from '../hooks/useBooks';
import { Link, useNavigate } from 'react-router-dom';
import CCI_LOGO from '../assets/logo.png';
import BookCover from '../components/BookCover';
import { Compass, LayoutGrid, Bookmark, PenLine, Heart, BookMarked, Home, Bell, Search, Eye, Star } from 'lucide-react';
import './Catalogue.css';

const CATEGORIES = ['Tous', 'Aqida', 'Fiqh', 'Sira', 'Hadith', 'Tazkiyya'];

const CatalogueDashboard = () => {
  const navigate = useNavigate();
  const { books, loading, error } = useBooks();
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeTab,    setActiveTab]    = useState('Tous');

  // Données de démo si la base est vide
  const mockBooks = [
    {
      _id: '1',
      title: 'La Voie du Groupe Sauvé',
      author: 'Collectif',
      coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
      description: 'Un ouvrage fondamental sur la croyance islamique selon le manhaj des Salaf.',
      category: 'Aqida',
      rating: 4.8,
    },
    {
      _id: '2',
      title: "L'Unicité de Dieu",
      author: 'Cheikh Mohammed Ibn Abdil-Wahhab',
      coverUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400',
      description: 'Le Kitab at-Tawhid, pilier de la compréhension de l\'unicité divine.',
      category: 'Tawhid',
      rating: 4.9,
    },
    {
      _id: '3',
      title: 'Etudes Islamiques Vol.I',
      author: 'Dr. Bilal Philips',
      coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400',
      description: 'Introduction complète aux fondements de l\'islam pour les nouvelles générations.',
      category: 'Fiqh',
      rating: 4.7,
    },
  ];

  const displayBooks = books && books.length > 0 ? books : mockBooks;

  useEffect(() => {
    if (displayBooks.length > 0 && !selectedBook) {
      setSelectedBook(displayBooks[0]);
    }
  }, [displayBooks]);

  const filteredBooks = displayBooks.filter(book => {
    const matchSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        book.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = activeTab === 'Tous' || book.category === activeTab;
    return matchSearch && matchTab;
  });

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg)' }}>
        <div className="loader-luxury">
          <div className="spinner" />
          <p style={{ marginTop: 16, color: 'var(--txt2)', fontSize: '0.9rem' }}>
            Chargement de la bibliothèque…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">

      {/* ─── SIDEBAR ───────────────────────────────────── */}
      <aside className="dash-sidebar">
        {/* Logo CCI */}
        <Link to="/" className="dash-logo-container" title="Accueil">
          <img src={CCI_LOGO} alt="Logo CCI" className="dash-logo-img" />
        </Link>

        <nav className="dash-nav">
          <a href="#" className="dash-nav-item active">
            <span className="dash-nav-icon"><Compass size={18} strokeWidth={1.8} /></span>
            <span>Découvrir</span>
          </a>
          <a href="#" className="dash-nav-item">
            <span className="dash-nav-icon"><LayoutGrid size={18} strokeWidth={1.8} /></span>
            <span>Catégories</span>
          </a>
          <a href="#" className="dash-nav-item">
            <span className="dash-nav-icon"><Bookmark size={18} strokeWidth={1.8} /></span>
            <span>Ma liste</span>
          </a>
          
          <Link to="/grands-hommes" className="dash-nav-item" style={{ marginTop: 10 }}>
            <span className="dash-nav-icon"><Star size={18} strokeWidth={1.8} /></span>
            <span>Grands Hommes</span>
          </Link>

          <div className="dash-nav-section">Collection</div>

          <a href="#" className="dash-nav-item">
            <span className="dash-nav-icon"><PenLine size={18} strokeWidth={1.8} /></span>
            <span>Auteurs</span>
          </a>
          <a href="#" className="dash-nav-item">
            <span className="dash-nav-icon"><Heart size={18} strokeWidth={1.8} /></span>
            <span>Favoris</span>
          </a>
        </nav>

        {/* Bas de sidebar */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/emprunts" className="dash-nav-item">
            <span className="dash-nav-icon"><BookMarked size={18} strokeWidth={1.8} /></span>
            <span>Emprunter</span>
          </Link>
          <Link to="/" className="dash-nav-item">
            <span className="dash-nav-icon"><Home size={18} strokeWidth={1.8} /></span>
            <span>Accueil</span>
          </Link>
        </div>
      </aside>

      {/* ─── MAIN ──────────────────────────────────────── */}
      <main className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div className="dash-search">
            <Search size={17} strokeWidth={2} color="var(--txt3)" />
            <input
              type="text"
              placeholder="Rechercher livres, auteurs…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="dash-profile">
            <div className="dash-notification" title="Notifications">
              <Bell size={18} strokeWidth={1.8} />
            </div>
            <div className="dash-user">
              <div className="dash-avatar">C</div>
              <span style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--txt1)' }}>CCI</span>
            </div>
          </div>
        </header>

        {/* Section recommandés */}
        <section className="dash-recommended">
          <h2 className="dash-section-title">Recommandés pour vous</h2>
          <div className="dash-carousel">
            {displayBooks.slice(0, 6).map((book, idx) => (
              <Link
                className="dash-carousel-item"
                key={`rec-${book._id || idx}`}
                to={`/livre/${book._id}`}
                onClick={() => setSelectedBook(book)}
              >
                <BookCover
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl || book.cover}
                  className="dash-carousel-img"
                  size="sm"
                />
                <div className="dash-carousel-info">
                  <h3 className="dash-carousel-title">{book.title}</h3>
                  <p className="dash-carousel-author">{book.author || 'Inconnu'}</p>
                  <div style={{ marginTop: 6, color: 'var(--gold-l)', fontSize: '0.85rem' }}>
                    {'★'.repeat(Math.round(book.rating || 4))}
                    <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - Math.round(book.rating || 4))}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Onglets + grille */}
        <section className="dash-categories">
          <div className="dash-grid-controls">
            <div className="dash-tabs">
              {CATEGORIES.map(tab => (
                <div
                  key={tab}
                  className={`dash-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>

          <div className="dash-grid">
            {filteredBooks.map(book => {
              const isSelected = selectedBook && selectedBook._id === book._id;
              return (
                <div
                  className={`dash-book-card ${isSelected ? 'selected' : ''}`}
                  key={book._id}
                  onClick={() => {
                    setSelectedBook(book);
                    // Si on est sur un petit écran (panel caché), naviguer directement
                    if (window.innerWidth <= 900) {
                      navigate(`/livre/${book._id}`);
                    }
                  }}
                >
                  <BookCover
                    title={book.title}
                    author={book.author}
                    coverUrl={book.coverUrl || book.cover}
                    className="dash-book-cover"
                    size="md"
                    style={{ aspectRatio: '2/3', width: '100%' }}
                  />
                  <div className="dash-book-info">
                    <div className="dash-book-info-title">{book.title}</div>
                    <div className="dash-book-info-author">{book.author || 'Inconnu'}</div>
                  </div>
                  <Link to={`/livre/${book._id}`} className="dash-book-overlay">
                    <Eye size={20} />
                    <span>Voir plus</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--txt3)' }}>
              <p style={{ fontSize: '2rem', marginBottom: 10, display: 'flex', justifyContent: 'center' }}><Search size={36} strokeWidth={1.5} color="var(--gold)" /></p>
              <p>Aucun ouvrage trouvé pour « {searchTerm} »</p>
            </div>
          )}
        </section>
      </main>

      {/* ─── PANEL DROITE ──────────────────────────────── */}
      <aside className="dash-right-panel">
        {selectedBook ? (
          <>
            <div className="dash-right-cover-wrapper">
              <BookCover
                title={selectedBook.title}
                author={selectedBook.author}
                coverUrl={selectedBook.coverUrl || selectedBook.cover}
                className="dash-right-cover"
                size="lg"
              />
            </div>

            <h2 className="dash-right-title">{selectedBook.title}</h2>
            <p className="dash-right-author">{selectedBook.author || 'Inconnu'}</p>

            <div className="dash-right-stats">
              <div className="dash-stat-item">
                <span className="dash-stat-value">{selectedBook.rating || '4.8'}</span>
                <span className="dash-stat-label">Note</span>
              </div>
              <div className="dash-stat-item">
                <span className="dash-stat-value" style={{ fontSize: '0.85rem' }}>{selectedBook.category || 'Islam'}</span>
                <span className="dash-stat-label">Catégorie</span>
              </div>
            </div>

            <p className="dash-right-desc">
              {selectedBook.description || "Aucun résumé disponible pour cet ouvrage. Explorez ce livre pour en découvrir la sagesse."}
            </p>

            <div className="dash-right-actions">
              <Link
                to={`/livre/${selectedBook._id}`}
                className="dash-btn-details"
              >
                <Eye size={16} /> Voir plus
              </Link>
              <Link
                to={`/emprunts?bookId=${selectedBook._id}`}
                style={{ width: '100%', textDecoration: 'none' }}
              >
                <button className="dash-btn-read">Emprunter ce livre</button>
              </Link>
            </div>
          </>
        ) : (
          <div className="dash-empty-state">
            <div className="dash-empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <BookMarked size={40} strokeWidth={1.2} color="var(--gold)" />
            </div>
            <p style={{ color: 'var(--txt3)', fontSize: '0.88rem' }}>
              Sélectionnez un livre pour voir les détails
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CatalogueDashboard;