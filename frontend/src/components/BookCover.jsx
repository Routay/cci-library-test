import { useState, useEffect, useRef } from 'react';
import { BookOpen } from 'lucide-react';

/**
 * Fetches a real book cover from Google Books API then Open Library as fallback.
 * Falls back to a styled SVG placeholder if nothing is found.
 */

const COVER_CACHE = {};

async function fetchCoverUrl(title, author) {
  const key = `${title}|${author}`;
  if (COVER_CACHE[key] !== undefined) return COVER_CACHE[key];

  try {
    const query = encodeURIComponent(`${title} ${author || ''}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items(volumeInfo/imageLinks)`
    );
    if (res.ok) {
      const data = await res.json();
      const img = data.items?.[0]?.volumeInfo?.imageLinks;
      const url = img?.thumbnail || img?.smallThumbnail || null;
      if (url) {
        // Upgrade to higher quality
        const hq = url.replace('zoom=1', 'zoom=2').replace('http://', 'https://');
        COVER_CACHE[key] = hq;
        return hq;
      }
    }
  } catch (_) { /* ignore */ }

  // Fallback: Open Library
  try {
    const query = encodeURIComponent(title);
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${query}&limit=1&fields=cover_i`
    );
    if (res.ok) {
      const data = await res.json();
      const coverId = data.docs?.[0]?.cover_i;
      if (coverId) {
        const url = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
        COVER_CACHE[key] = url;
        return url;
      }
    }
  } catch (_) { /* ignore */ }

  COVER_CACHE[key] = null;
  return null;
}

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
  const [loading, setLoading]   = useState(!imgSrc);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    const direct = coverUrl || cover;
    if (direct) { setImgSrc(direct); setLoading(false); return; }
    if (!title) { setLoading(false); return; }

    setLoading(true);
    fetchCoverUrl(title, author).then(url => {
      if (!mounted.current) return;
      setImgSrc(url);
      setLoading(false);
    });
  }, [title, author, coverUrl, cover]);

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
      {/* Shimmer while loading */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)',
          animation: 'shimmer 1.4s infinite',
        }} />
      )}
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
