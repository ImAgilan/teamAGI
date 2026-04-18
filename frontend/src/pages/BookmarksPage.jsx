/**
 * BookmarksPage — TeamAGI
 */
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { postService } from '../services';
import PostCard from '../components/feed/PostCard';
import PostSkeleton from '../components/feed/PostSkeleton';

export default function BookmarksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => postService.getBookmarks(),
    select: (r) => r.data.posts,
  });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 0' }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', marginBottom: 14 }}>
        <Bookmark size={20} style={{ color: 'var(--brand)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Bookmarks
        </h1>
        {data?.length > 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            {data.length} saved
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div>{[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}</div>
      )}

      {/* Empty */}
      {!isLoading && !data?.length && (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Bookmark size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--text-muted)', display: 'block' }} />
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            No bookmarks yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Tap the bookmark icon on any post to save it here.
          </p>
        </div>
      )}

      {/* Posts */}
      {data?.map((post) => (
        <PostCard key={post._id} post={post} queryKey={['bookmarks']} />
      ))}
    </div>
  );
}
