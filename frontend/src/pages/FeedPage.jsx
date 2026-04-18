/**
 * FeedPage — TeamAGI
 *
 * Fix: After creating a post, the feed was showing stale cache (no images).
 * Now uses refetchType:'all' to force a full re-fetch of all pages.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw, Rss } from 'lucide-react';
import { postService } from '../services';
import PostCard from '../components/feed/PostCard';
import SuggestedUsers from '../components/feed/SuggestedUsers';
import TrendingHashtags from '../components/feed/TrendingHashtags';
import CreatePostBar from '../components/feed/CreatePostBar';
import PostSkeleton from '../components/feed/PostSkeleton';

export default function FeedPage() {
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => postService.getFeed(pageParam),
    getNextPageParam: (lastPage) => {
      const p = lastPage?.data?.pagination;
      if (!p) return undefined;
      return p.page < p.pages ? p.page + 1 : undefined;
    },
    // Force fresh data on mount so newly created posts show immediately
    refetchOnMount: true,
  });

  // Infinite scroll
  const handleObserver = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const handleRefresh = () => {
    // refetchType:'all' re-fetches ALL pages of the infinite query
    queryClient.invalidateQueries({ queryKey: ['feed'], refetchType: 'all' });
  };

  // Safely flatten all pages — each page's posts array
  const allPosts = data?.pages?.flatMap((page) => {
    const posts = page?.data?.posts;
    return Array.isArray(posts) ? posts : [];
  }) ?? [];

  return (
    <div className="feed-layout">
      {/* Main feed */}
      <div className="feed-main">
        <CreatePostBar />

        {/* Refresh button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, padding: '5px 16px',
              borderRadius: 999, border: '1px solid var(--border)',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: isRefetching ? 'feedSpin 0.8s linear infinite' : 'none' }}
            />
            {isRefetching ? 'Refreshing…' : 'Refresh feed'}
          </button>
        </div>

        {/* Skeletons */}
        {isLoading && [...Array(3)].map((_, i) => <PostSkeleton key={i} />)}

        {/* Empty state */}
        {!isLoading && allPosts.length === 0 && (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center', margin: '0 0 8px' }}>
            <Rss size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--text-muted)', display: 'block' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
              Your feed is empty
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Follow people to see their posts, or explore trending content.
            </p>
          </div>
        )}

        {/* Posts */}
        {allPosts.map((post, i) => (
          <div key={post._id} style={{ animationDelay: `${Math.min(i % 8, 5) * 40}ms` }}>
            <PostCard post={post} queryKey={['feed']} />
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={loadMoreRef} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isFetchingNextPage && (
            <Loader2 size={22} style={{ color: 'var(--text-muted)', animation: 'feedSpin 1s linear infinite' }} />
          )}
          {!hasNextPage && allPosts.length > 5 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>You're all caught up ✓</p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <aside className="feed-aside">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TrendingHashtags />
          <SuggestedUsers />
        </div>
      </aside>

      <style>{`@keyframes feedSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
