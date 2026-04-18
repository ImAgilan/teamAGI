/**
 * HashtagCard — Trending hashtag card
 */
import { Link } from 'react-router-dom';
import { Hash } from 'lucide-react';

export default function HashtagCard({ hashtag }) {
  return (
    <Link
      to={`/explore?q=${encodeURIComponent('#' + hashtag.tag)}`}
      className="card flex items-center gap-3 p-3 hover:shadow-md transition-shadow group"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-tertiary)' }}
      >
        <Hash size={18} style={{ color: 'var(--brand)' }} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate group-hover:underline" style={{ color: 'var(--text-primary)' }}>
          #{hashtag.tag}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {hashtag.postsCount.toLocaleString()} posts
        </p>
      </div>
    </Link>
  );
}
