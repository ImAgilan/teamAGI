/**
 * PostCard — TeamAGI
 * Fixed: images always render when m.url exists
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { postService } from '../../services';
import Avatar from '../shared/Avatar';
import CommentSection from './CommentSection';
import PostMenu from './PostMenu';
import useAuthStore from '../../store/authStore';

// ── Single media item (image or video) ────────────────────────
function MediaItem({ m, total }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!m?.url) return null;

  const maxH = total === 1 ? 480 : 260;

  if (m.type === 'video') {
    return (
      <video
        src={m.url}
        controls
        playsInline
        style={{
          width: '100%', display: 'block',
          maxHeight: maxH, objectFit: 'cover',
          background: '#000', borderRadius: 0,
        }}
      />
    );
  }

  return (
    <div style={{ position: 'relative', background: 'var(--bg-tertiary)', minHeight: 80 }}>
      {/* Loading shimmer */}
      {!loaded && !error && (
        <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
      )}
      {/* The actual image */}
      {!error && (
        <img
          src={m.url}
          alt="post media"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(true); }}
          style={{
            width: '100%',
            display: 'block',
            objectFit: 'cover',
            maxHeight: maxH,
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      {/* Error state */}
      {error && (
        <div style={{
          height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          Image unavailable
        </div>
      )}
    </div>
  );
}

export default function PostCard({ post, queryKey }) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isOwn = post.author?._id === currentUser?._id;

  // ── Like ─────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => postService.toggleLike(post._id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const patch = (p) =>
          p._id === post._id
            ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? Math.max(0, (p.likesCount||0)-1) : (p.likesCount||0)+1 }
            : p;
        if (old.pages) return { ...old, pages: old.pages.map((pg) => ({ ...pg, posts: (pg.posts||[]).map(patch) })) };
        if (old.posts) return { ...old, posts: old.posts.map(patch) };
        if (Array.isArray(old)) return old.map(patch);
        return old;
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ── Bookmark ──────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: () => postService.toggleBookmark(post._id),
    onSuccess: (res) => {
      toast.success(res?.data?.isBookmarked ? 'Bookmarked!' : 'Removed bookmark');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Hashtag/mention renderer ──────────────────────────────
  const renderText = (text) => {
    if (!text) return null;
    return text.split(/(\s+)/).map((word, i) => {
      if (/^#\w+/.test(word))
        return <Link key={i} to={`/explore?q=${encodeURIComponent(word)}`} style={{ color: 'var(--brand)', fontWeight: 500 }}>{word}</Link>;
      if (/^@\w+/.test(word))
        return <Link key={i} to={`/profile/${word.slice(1)}`} style={{ color: 'var(--brand)', fontWeight: 500 }}>{word}</Link>;
      return word;
    });
  };

  const ActionBtn = ({ onClick, active, activeColor, hoverBg, children }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? activeColor : 'var(--text-muted)',
        fontSize: 13, fontWeight: 500,
        padding: '5px 8px', borderRadius: 8, transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; if (!active) e.currentTarget.style.color = activeColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      {children}
    </button>
  );

  return (
    <article className="card animate-feed-item" style={{ marginBottom: 8, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <Link to={`/profile/${post.author?.username}`}>
            <Avatar src={post.author?.avatar?.url} name={post.author?.displayName || '?'} size={42} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <Link to={`/profile/${post.author?.username}`} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', display: 'block' }}>
              {post.author?.displayName}
            </Link>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              @{post.author?.username}
              {post.createdAt ? ` · ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}` : ''}
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="btn-ghost"
            style={{ padding: 6 }}
            onClick={() => setShowMenu((v) => !v)}
          >
            <MoreHorizontal size={18} />
          </button>
          {showMenu && <PostMenu post={post} isOwn={isOwn} queryKey={queryKey} onClose={() => setShowMenu(false)} />}
        </div>
      </div>

      {/* Text content */}
      {post.content && (
        <div style={{ padding: '0 16px 10px' }}>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {renderText(post.content)}
          </p>
        </div>
      )}

      {/* ── Media grid ─────────────────────────────────────── */}
      {post.media && post.media.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: post.media.length === 1 ? '1fr' : '1fr 1fr',
            gap: 2,
            marginBottom: 2,
            overflow: 'hidden',
          }}
        >
          {post.media.map((m, idx) => (
            <MediaItem key={`${post._id}-media-${idx}`} m={m} total={post.media.length} />
          ))}
        </div>
      )}

      {/* Quoted repost */}
      {post.isRepost && post.originalPost && (
        <div style={{ margin: '0 16px 10px', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', background: 'var(--bg-tertiary)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Original post</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{post.originalPost.content}</p>
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 10px' }}>
        <ActionBtn
          onClick={() => likeMutation.mutate()}
          active={post.isLiked}
          activeColor="#ef4444"
          hoverBg="rgba(239,68,68,0.08)"
        >
          <Heart size={19} strokeWidth={1.8} fill={post.isLiked ? '#ef4444' : 'none'} stroke={post.isLiked ? '#ef4444' : 'currentColor'} />
          <span>{post.likesCount > 0 ? post.likesCount : ''}</span>
        </ActionBtn>

        <ActionBtn
          onClick={() => setShowComments((v) => !v)}
          active={showComments}
          activeColor="var(--brand)"
          hoverBg="rgba(var(--brand-rgb),0.08)"
        >
          <MessageCircle size={19} strokeWidth={1.8} />
          <span>{post.commentsCount > 0 ? post.commentsCount : ''}</span>
        </ActionBtn>

        <ActionBtn active={false} activeColor="#10b981" hoverBg="rgba(16,185,129,0.08)">
          <Repeat2 size={19} strokeWidth={1.8} />
          <span>{post.sharesCount > 0 ? post.sharesCount : ''}</span>
        </ActionBtn>

        <ActionBtn
          onClick={() => bookmarkMutation.mutate()}
          active={post.isBookmarked}
          activeColor="var(--brand)"
          hoverBg="rgba(var(--brand-rgb),0.08)"
        >
          <Bookmark size={19} strokeWidth={1.8} fill={post.isBookmarked ? 'var(--brand)' : 'none'} stroke={post.isBookmarked ? 'var(--brand)' : 'currentColor'} />
        </ActionBtn>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          <CommentSection postId={post._id} />
        </div>
      )}
    </article>
  );
}
