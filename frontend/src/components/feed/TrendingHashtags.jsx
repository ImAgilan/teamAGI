/**
 * TrendingHashtags — Right sidebar widget
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { searchService } from '../../services';

export default function TrendingHashtags() {
  const { data, isLoading } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: () => searchService.getTrendingHashtags(),
    select: (r) => r.data.hashtags,
    staleTime: 1000 * 60 * 10, // 10 min
  });

  if (isLoading) return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-4 w-28 rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-2.5 w-16 rounded" />
        </div>
      ))}
    </div>
  );

  if (!data?.length) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} style={{ color: 'var(--brand)' }} />
        <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          Trending
        </h3>
      </div>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <Link
            key={item._id}
            to={`/explore?tag=${item.tag}`}
            className="flex items-center justify-between group"
          >
            <div>
              <p
                className="text-sm font-semibold group-hover:underline"
                style={{ color: 'var(--text-primary)' }}
              >
                #{item.tag}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {item.postsCount.toLocaleString()} posts
              </p>
            </div>
            <span
              className="text-xs font-mono"
              style={{ color: 'var(--text-muted)' }}
            >
              #{idx + 1}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
