import { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';

// The backend now handles fetching covers automatically upon creation.
// COVER_CACHE and fetchCoverUrl have been removed to prevent client-side rate limiting (HTTP 429).

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
  title,
  author,
  coverUrl,       // URL already stored in DB (priority)
  cover,          // Legacy field name
  style = {},
  className = '',
  size = 'md',    // 'sm' | 'md' | 'lg'
}) {
  const [imgSrc, setImgSrc]     = useState(coverUrl || cover || null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // If the cover URL is provided from the DB, use it
    setImgSrc(coverUrl || cover || null);
    setImgError(false); // Reset error state on new cover
  }, [coverUrl, cover]);

  const [bg1, bg2, accent] = getColorPalette(title);

  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 56 : 36;
  const fontSize = size === 'sm' ? '0.6rem' : size === 'lg' ? '0.85rem' : '0.7rem';

  if (imgSrc && !imgError) {
    return (
      <img
        src={imgSrc}
        alt={`Couverture : ${title}`}
        className={className}
        style={{ objectFit: 'cover', ...style }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Elegant placeholder
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
      {/* Decorative border */}
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
          fontSize,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '90%',
          opacity: 0.85,
          fontFamily: "'Cormorant Garamond', serif",
          letterSpacing: '0.5px',
        }}>
          {title.length > 28 ? title.slice(0, 28) + '…' : title}
        </span>
      )}
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
