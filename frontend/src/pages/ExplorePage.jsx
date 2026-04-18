/**
 * ExplorePage — TeamAGI Search + Trending
 * Fixed: proper content container, no broken Tailwind classes
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Hash, Users, FileText, TrendingUp } from 'lucide-react';
import { searchService } from '../services';
import PostCard from '../components/feed/PostCard';
import UserCard from '../components/explore/UserCard';
import HashtagCard from '../components/explore/HashtagCard';
import { useDebounce } from '../hooks/useDebounce';

const TABS = [
  { value: 'all',      label: 'All',      icon: Search   },
  { value: 'posts',    label: 'Posts',    icon: FileText  },
  { value: 'users',    label: 'People',   icon: Users     },
  { value: 'hashtags', label: 'Hashtags', icon: Hash      },
];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState('all');
  const debouncedQuery = useDebounce(query, 400);

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search', debouncedQuery, tab],
    queryFn: () => searchService.search(debouncedQuery, tab),
    enabled: debouncedQuery.length > 0,
    select: (r) => r.data.results,
  });

  const { data: trending } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: () => searchService.getTrendingHashtags(),
    select: (r) => r.data.hashtags,
  });

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val) setSearchParams({ q: val });
    else setSearchParams({});
  };

  const hasResults = searchResults &&
    Object.values(searchResults).some((v) => Array.isArray(v) && v.length > 0);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '126px 0' }} className="animate-fade-in">

      {/* Search bar */}
      <div style={{ position: 'relative', margin: '0 0 14px', padding: '0 16px' }}>
        <Search size={17} style={{
          position: 'absolute', left: 30, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)',
          pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search TeamAGI…"
          className="input"
          style={{ paddingLeft: 44 }}
          autoFocus
        />
      </div>

      {/* Filter tabs (only when searching) */}
      {query && (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
          marginBottom: 14, padding: '0 16px 4px',
        }}>
          {TABS.map(({ value, label, icon: Icon }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                onClick={() => setTab(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                  background: active ? 'var(--brand)' : 'var(--bg-secondary)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  boxShadow: active ? '0 2px 8px rgba(var(--brand-rgb),0.25)' : '0 0 0 1px var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* No query → show trending */}
      {!query && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} style={{ color: 'var(--brand)' }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
              Trending now
            </h2>
          </div>
          {trending?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {trending.map((item) => (
                <HashtagCard key={item._id} hashtag={item} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No trending topics yet.</p>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {searching && (
        <div style={{ padding: '0 16px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8 }}>
              <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 13, width: 140, marginBottom: 7, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: 220, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!searching && query && (
        <div>
          {/* People */}
          {searchResults?.users?.length > 0 && (
            <section style={{ marginBottom: 20, padding: '0 16px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                People
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.users.map((u) => <UserCard key={u._id} user={u} />)}
              </div>
            </section>
          )}

          {/* Hashtags */}
          {searchResults?.hashtags?.length > 0 && (
            <section style={{ marginBottom: 20, padding: '0 16px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hashtags
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {searchResults.hashtags.map((h) => <HashtagCard key={h._id} hashtag={h} />)}
              </div>
            </section>
          )}

          {/* Posts */}
          {searchResults?.posts?.length > 0 && (
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, padding: '0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Posts
              </h3>
              {searchResults.posts.map((post) => (
                <PostCard key={post._id} post={post} queryKey={['search', debouncedQuery]} />
              ))}
            </section>
          )}

          {/* Empty */}
          {!searching && !hasResults && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Search size={44} style={{ margin: '0 auto 14px', opacity: 0.15, color: 'var(--text-muted)', display: 'block' }} />
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                No results for "{query}"
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Try a different keyword or browse trending topics
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
