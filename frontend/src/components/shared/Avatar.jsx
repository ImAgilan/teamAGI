/**
 * Avatar Component — TeamAGI
 * Pure inline styles — no Tailwind classes (they get purged in prod)
 */
import { useState } from 'react';

const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b',
  '#10b981','#06b6d4','#f97316','#3b82f6',
];

export default function Avatar({ src, name = '', size = 40, style = {}, onClick }) {
  const [imgError, setImgError] = useState(false);

  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const fontSize = size <= 28 ? 10 : size <= 36 ? 12 : size <= 48 ? 14 : size <= 64 ? 16 : 20;
  const colorIndex = (name?.charCodeAt(0) || 0) % COLORS.length;

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    overflow: 'hidden',
    ...style,
  };

  // Show initials fallback if: no src, or src failed to load
  if (!src || imgError) {
    return (
      <div
        onClick={onClick}
        style={{
          ...baseStyle,
          background: COLORS[colorIndex],
          color: '#fff',
          fontWeight: 700,
          fontSize,
          letterSpacing: '-0.02em',
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'avatar'}
      onClick={onClick}
      onError={() => setImgError(true)}
      style={{
        ...baseStyle,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}
