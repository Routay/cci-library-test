import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import './BookCover.css';

// Palette de couleurs de fond basée sur la première lettre du titre
const BG_PALETTES = [
  ['#1A2E2A', '#2E4A42', '#5DCAA5'],
  ['#1A2040', '#2E3A6E', '#60A5FA'],
  ['#2E1A10', '#4A2E1A', '#FBBF24'],
  ['#2A1A30', '#40284A', '#C084FC'],
  ['#1A2A10', '#2E4A1A', '#86EFAC'],
  ['#2A1A1A', '#4A2828', '#F87171'],
  ['#1A2530', '#2E3F50', '#38BDF8'],
  ['#2A2210', '#4A3C1A', '#FCD34D'],
];

function getColorPalette(str) {
  if (!str) return BG_PALETTES[0];
  const idx = str.charCodeAt(0) % BG_PALETTES.length;
  return BG_PALETTES[idx];
}

export default function BookCover({
  title = '',
  author = '',
  coverUrl,       // URL déjà en BDD (prioritaire)
  cover,          // Ancien nom de champ
  style = {},
  className = '',
  size = 'md',    // 'sm' | 'md' | 'lg'
  stage = true,   // Présentation unifiée avec décor de bibliothèque et cadre vert CCI
}) {
  const [imgSrc, setImgSrc]     = useState(coverUrl || cover || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgSrc(coverUrl || cover || null);
    setImgError(false);
  }, [coverUrl, cover]);

  const [bg1, bg2, accent] = getColorPalette(title);
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  // ── Mode 1 : Présentation Studio Stage (Décor bibliothèque CCI) ──
  if (stage) {
    return (
      <div className={`book-stage-frame ${className}`} style={style}>

        {/* Emplacement centré du livre */}
        <div className="book-stage-slot">
          {imgSrc && !imgError ? (
            <img
              src={imgSrc}
              alt={`Couverture : ${title}`}
              className="book-stage-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="book-stage-placeholder"
              style={{
                background: `linear-gradient(145deg, ${bg1} 0%, ${bg2} 100%)`,
              }}
            >
              <div className="book-stage-ph-inner">
                <BookOpen size={iconSize} color={accent} strokeWidth={1.5} />
                {title && <span className="book-stage-ph-title">{title}</span>}
                {author && <span className="book-stage-ph-author">{author}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mode 2 : Mode plat simple (stage = false) ──
  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt={`Couverture : ${title}`}
        className={`book-cover-flat ${className}`}
        style={{ objectFit: 'cover', ...style }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Placeholder plat
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(145deg, ${bg1} 0%, ${bg2} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{
        position: 'absolute', inset: 8,
        border: `1px solid ${accent}30`,
        borderRadius: 6,
        pointerEvents: 'none',
      }} />
      <BookOpen size={iconSize} color={accent} strokeWidth={1.5} />
      {title && (
        <span style={{
          color: accent,
          fontSize: size === 'sm' ? '0.6rem' : '0.75rem',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '90%',
          opacity: 0.85,
          fontFamily: "'Open Sans', sans-serif",
          letterSpacing: '0.5px',
        }}>
          {title.length > 28 ? title.slice(0, 28) + '…' : title}
        </span>
      )}
    </div>
  );
}
