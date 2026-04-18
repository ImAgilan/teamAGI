/**
 * ProfilePage — TeamAGI
 *
 * Fixes:
 *  1. Message button now appears when viewing another user's profile
 *     → clicking navigates to /messages and opens a new conversation
 *  2. Action row shows: [Follow/Following]  [Message]  when viewing others
 *     Own profile shows: [Edit profile]
 *  3. Cover / avatar overlap fixed (marginTop: -48, border ring)
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, MapPin, Link2, Grid, List,
  UserCheck, UserPlus, Loader2, Edit3, MessageCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { userService, postService, followService, messageService } from '../services';
import useAuthStore from '../store/authStore';
import PostCard from '../components/feed/PostCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import Avatar from '../components/shared/Avatar';

export default function ProfilePage() {
  const { username }  = useParams();
  const navigate      = useNavigate();
  const currentUser   = useAuthStore((s) => s.user);
  const queryClient   = useQueryClient();

  const [view,      setView]      = useState('list');
  const [activeTab, setActiveTab] = useState('posts');
  const [showEdit,  setShowEdit]  = useState(false);

  // ── Fetch profile ─────────────────────────────────────────
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn:  () => userService.getProfile(username),
    select:   (r) => r.data,
    enabled:  !!username,
  });

  const profile = profileData?.user;

  // ── Fetch this user's posts ───────────────────────────────
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', profile?._id],
    queryFn:  () => postService.getUserPosts(profile._id),
    enabled:  !!profile?._id,
    select:   (r) => r.data,
  });

  // ── Follow / Unfollow ─────────────────────────────────────
  const followMutation = useMutation({
    mutationFn: () => followService.toggleFollow(profile._id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username], refetchType: 'all' });
      toast.success(res?.data?.isFollowing ? 'Following!' : 'Unfollowed');
    },
    onError: () => toast.error('Could not update follow status'),
  });

  // ── Message — send first message and go to conversation ───
  const messageMutation = useMutation({
    mutationFn: () =>
      messageService.sendMessage({
        recipientId: profile._id,
        content:     `👋 Hi ${profile.displayName}!`,
      }),
    onSuccess: (res) => {
      const convId = res?.data?.conversationId;
      if (convId) {
        navigate(`/messages/${convId}`);
      } else {
        navigate('/messages');
      }
    },
    onError: () => {
      // Even if send fails, navigate to messages page
      navigate('/messages');
    },
  });

  // ── Loading skeleton ──────────────────────────────────────
  if (isLoading) return <ProfileSkeleton />;

  if (!profile) return (
    <div style={{ padding: '64px 24px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>User not found</p>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>@{username} doesn't exist.</p>
    </div>
  );

  const isOwn = profile._id === currentUser?._id;
  const posts = postsData?.posts || [];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }} className="animate-fade-in">

      {/* ── Cover image ───────────────────────────────────── */}
      <div style={{
        height: 200,
        background: profile.coverImage?.url
          ? undefined
          : 'linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #8b5cf6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {profile.coverImage?.url && (
          <img
            src={profile.coverImage.url}
            alt="Cover"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>

      {/* ── Profile header ────────────────────────────────── */}
      <div style={{ padding: '0 16px 16px', background: 'var(--card-bg)' }}>

        {/* Avatar + action buttons row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: -48,     /* pull avatar up over cover bottom edge */
          marginBottom: 14,
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {/* Avatar with border ring */}
          <div style={{
            borderRadius: '50%',
            border: '4px solid var(--card-bg)',
            background: 'var(--card-bg)',
            lineHeight: 0,
            flexShrink: 0,
          }}>
            <Avatar src={profile.avatar?.url} name={profile.displayName} size={96} />
          </div>

          {/* ── Action buttons ──────────────────────────── */}
          <div style={{
            display: 'flex', gap: 8,
            paddingBottom: 4,
            flexWrap: 'wrap',
            // Align to the right even when wrapped
            marginLeft: 'auto',
          }}>
            {isOwn ? (
              /* Own profile → Edit */
              <button
                onClick={() => setShowEdit(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 20,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <Edit3 size={14} />
                Edit profile
              </button>
            ) : (
              <>
                {/* Follow / Unfollow */}
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 18px', borderRadius: 20,
                    border: profile.isFollowing ? '1.5px solid var(--border)' : 'none',
                    background: profile.isFollowing ? 'var(--bg-secondary)' : 'var(--brand)',
                    color: profile.isFollowing ? 'var(--text-primary)' : '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                    minWidth: 96, justifyContent: 'center',
                  }}
                >
                  {followMutation.isPending ? (
                    <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : profile.isFollowing ? (
                    <><UserCheck size={14} /> Following</>
                  ) : (
                    <><UserPlus size={14} /> Follow</>
                  )}
                </button>

                {/* ── Message button ── */}
                <button
                  onClick={() => messageMutation.mutate()}
                  disabled={messageMutation.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 18px', borderRadius: 20,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--brand)';
                    e.currentTarget.style.color = 'var(--brand)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  {messageMutation.isPending
                    ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                    : <MessageCircle size={14} />
                  }
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name, username, bio */}
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
            {profile.displayName}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: profile.bio ? 8 : 0 }}>
            @{profile.username}
          </p>
          {profile.bio && (
            <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Meta: location, website, joined */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 14 }}>
          {profile.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
              <MapPin size={13} /> {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--brand)' }}
            >
              <Link2 size={13} />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-muted)' }}>
            <Calendar size={13} />
            Joined {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : '—'}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          {[
            { label: 'Posts',     value: profile.postsCount     || 0 },
            { label: 'Followers', value: profile.followersCount || 0 },
            { label: 'Following', value: profile.followingCount || 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
                {value.toLocaleString()}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 5 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs + view toggle */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginTop: 4 }}>
          {['posts', 'media'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px', fontSize: 14, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                textTransform: 'capitalize', position: 'relative',
                color: activeTab === tab ? 'var(--brand)' : 'var(--text-muted)',
                transition: 'color 0.15s',
              }}
            >
              {tab}
              {activeTab === tab && (
                <span style={{
                  position: 'absolute', bottom: -1, left: 0, right: 0,
                  height: 2, borderRadius: 2, background: 'var(--brand)',
                }} />
              )}
            </button>
          ))}

          {/* List / Grid toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, paddingBottom: 4 }}>
            {[{ val: 'list', Icon: List }, { val: 'grid', Icon: Grid }].map(({ val, Icon }) => (
              <button
                key={val}
                onClick={() => setView(val)}
                style={{
                  padding: 6, borderRadius: 8, border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  color: view === val ? 'var(--brand)' : 'var(--text-muted)',
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Posts ────────────────────────────────────────── */}
      <div>
        {postsLoading && [...Array(2)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 16, marginBottom: 8 }}>
            <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
          </div>
        ))}

        {!postsLoading && posts.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              No posts yet
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {isOwn
                ? 'Share something with the world!'
                : `${profile.displayName} hasn't posted yet.`}
            </p>
          </div>
        )}

        {/* List view */}
        {!postsLoading && view === 'list' && activeTab === 'posts' &&
          posts.map((post) => (
            <PostCard key={post._id} post={post} queryKey={['userPosts', profile._id]} />
          ))
        }

        {/* Grid view — media only */}
        {!postsLoading && view === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
            {posts.filter((p) => p.media?.length > 0).map((post) => (
              <div key={post._id} style={{ aspectRatio: '1', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                {post.media[0].type === 'video' ? (
                  <video src={post.media[0].url} muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <img src={post.media[0].url} alt="" loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div style={{ padding: '0 16px', background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -48, marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid var(--card-bg)' }} />
          <div style={{ display: 'flex', gap: 8, paddingTop: 52 }}>
            <div className="skeleton" style={{ width: 110, height: 36, borderRadius: 20 }} />
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 20 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 18, width: 180, marginBottom: 8, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 12, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 8 }} />
      </div>
    </div>
  );
}
