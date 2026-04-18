/**
 * CreatePostModal — TeamAGI
 *
 * Fixes applied:
 *  1. Images now show in preview AND get uploaded correctly
 *     → FormData is built correctly; api.js no longer forces Content-Type
 *  2. Emoji picker is fully functional (no external library needed)
 *  3. Modal is centered on desktop, bottom-sheet on mobile
 *  4. Media preview grid renders immediately after file selection
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Image, Smile, Globe, Users, Lock, Loader2, Video } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { postService } from '../../services';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import Avatar from '../shared/Avatar';

// ── Emoji data (no library needed) ───────────────────────────
const EMOJI_GROUPS = [
  {
    label: 'Smileys',
    emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😊','🙂','🤩','😍','🥰','😘','😎','🤓','🧐','🤔','😏','😒','🙄','😤','😠','😡','🤯','😳','🥵','🥶','😱','😨','😰','😢','😭','🥺','😞','😓','😩','😫','😪','😴','🤤','🤢','🤮','🤧','🥴','😵'],
  },
  {
    label: 'Gestures',
    emojis: ['👍','👎','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','💪','🦾','🙏','🤲','👐','🫶','❤️','🧡','💛','💚','💙','💜','🖤','❤️‍🔥','💔','💯','✨','🔥','⚡','🌟','💫','🎉','🎊','🏆','🥇','🎯'],
  },
  {
    label: 'Nature',
    emojis: ['🌸','🌺','🌻','🌹','🌷','🌿','🍀','🍁','🍂','🍃','🌱','🌲','🌳','🌴','🌵','🎋','🎍','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐙','🦋','🐝','🐛','🦀','🐠','🐬','🦜'],
  },
  {
    label: 'Food',
    emojis: ['🍕','🍔','🍟','🌭','🌮','🌯','🥗','🍜','🍝','🍣','🍱','🥟','🍦','🍰','🎂','🧁','🍩','🍪','☕','🧋','🍵','🧃','🥤','🍺','🥂','🍾','🍷','🧊','🍓','🍇','🍊','🍋','🍌','🍉','🍑','🥭','🍍'],
  },
  {
    label: 'Activity',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🏐','🏉','🎾','🏸','🏒','🥊','🏋️','🤸','⛹️','🤺','🧘','🚴','🏊','🤽','🧗','🏄','🚵','🎿','🛷','🥌','🎯','🎱','🎮','🕹️','🎲','🎭','🎨','🖼️','🎸','🎹','🥁','🎻','🎺','🎤','🎧'],
  },
  {
    label: 'Travel',
    emojis: ['✈️','🚀','🛸','🚁','🚂','🚃','🚄','🚅','🚇','🚌','🚎','🏎️','🚗','🛻','🚐','🚑','🚒','🛵','🏍️','🚲','🛴','🛹','🚤','⛵','🛥️','🗺️','🌍','🌎','🌏','🗼','🗽','🏰','🏯','⛩️','🕌','🛕','⛪','🏠','🏡'],
  },
];

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Everyone', icon: Globe  },
  { value: 'followers', label: 'Followers', icon: Users  },
  { value: 'private',   label: 'Only me',  icon: Lock   },
];

const MAX_CHARS = 2200;

export default function CreatePostModal() {
  const { closeCreatePost } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const fileRef = useRef(null);
  const textRef = useRef(null);
  const emojiRef = useRef(null);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);          // { file, preview, type }[]
  const [visibility, setVisibility] = useState('public');
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 640);

  // Responsive detection
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-focus textarea
  useEffect(() => { setTimeout(() => textRef.current?.focus(), 100); }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const remaining = MAX_CHARS - content.length;
  const overLimit = remaining < 0;
  const isEmpty = !content.trim() && media.length === 0;

  // ── Insert emoji at cursor position ──────────────────────
  const insertEmoji = useCallback((emoji) => {
    const el = textRef.current;
    if (!el) {
      setContent((c) => c + emoji);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(newContent);
    // Restore cursor after emoji
    setTimeout(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  }, [content]);

  // ── File selection ────────────────────────────────────────
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (media.length + files.length > 4) {
      toast.error('Maximum 4 media files allowed');
      return;
    }
    const items = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),  // blob URL for immediate preview
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMedia((prev) => [...prev, ...items]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const removeMedia = (idx) => {
    URL.revokeObjectURL(media[idx].preview);
    setMedia((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('content', content.trim());
      fd.append('visibility', visibility);
      // Append each file — multer parses field 'media'
      media.forEach((m) => fd.append('media', m.file));
      // Do NOT set Content-Type — axios auto-sets multipart/form-data + boundary
      return postService.createPost(fd);
    },
    onSuccess: () => {
      toast.success('Post published! 🚀');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      closeCreatePost();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to publish post';
      toast.error(msg);
    },
  });

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) closeCreatePost();
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isEmpty && !overLimit && !mutation.isPending) mutation.mutate();
    }
    if (e.key === 'Escape') closeCreatePost();
  };

  return (
    <>
      <style>{`
        @keyframes modalIn   { from { opacity:0; transform:scale(.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes sheetUp   { from { transform:translateY(100%) } to { transform:translateY(0) } }
        @keyframes spin      { to { transform:rotate(360deg) } }
        @keyframes emojiIn   { from { opacity:0; transform:scale(.9) translateY(6px) } to { opacity:1; transform:scale(1) translateY(0) } }
      `}</style>

      {/* ── Backdrop ─────────────────────────────────────── */}
      <div
        onClick={handleBackdrop}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: isDesktop ? 'center' : 'flex-end',
          justifyContent: 'center',
          padding: isDesktop ? 24 : 0,
        }}
      >
        {/* ── Modal panel ──────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: isDesktop ? 560 : '100%',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: isDesktop ? 20 : '20px 20px 0 0',
            display: 'flex', flexDirection: 'column',
            maxHeight: isDesktop ? '88vh' : '95vh',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            animation: isDesktop ? 'modalIn .22s cubic-bezier(.16,1,.3,1)' : 'sheetUp .26s cubic-bezier(.16,1,.3,1)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '13px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <button
              onClick={closeCreatePost}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>

            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              New Post
            </span>

            <button
              onClick={() => mutation.mutate()}
              disabled={isEmpty || overLimit || mutation.isPending}
              style={{
                padding: '7px 20px', borderRadius: 20,
                border: 'none',
                background: isEmpty || overLimit ? 'var(--bg-tertiary)' : 'var(--brand)',
                color: isEmpty || overLimit ? 'var(--text-muted)' : '#fff',
                fontWeight: 700, fontSize: 14, cursor: isEmpty || overLimit ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
              }}
            >
              {mutation.isPending
                ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} /> Posting…</>
                : 'Post'}
            </button>
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 4px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar src={user?.avatar?.url} name={user?.displayName || 'U'} size={42} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + visibility */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                    {user?.displayName}
                  </span>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    style={{
                      fontSize: 12, fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 999,
                      border: '1.5px solid var(--brand)',
                      background: 'var(--brand-light)',
                      color: 'var(--brand)',
                      cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                      appearance: 'none', WebkitAppearance: 'none',
                    }}
                  >
                    {VISIBILITY_OPTIONS.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind?"
                  rows={5}
                  style={{
                    width: '100%', resize: 'none', border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 15, lineHeight: 1.65,
                    color: 'var(--text-primary)', fontFamily: 'inherit',
                    caretColor: 'var(--brand)',
                  }}
                />

                {/* ── Media preview grid ─────────────────── */}
                {media.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: media.length === 1 ? '1fr' : '1fr 1fr',
                    gap: 6, marginTop: 8, marginBottom: 4,
                    borderRadius: 12, overflow: 'hidden',
                  }}>
                    {media.map((m, idx) => (
                      <div key={idx} style={{ position: 'relative', background: '#000', borderRadius: 10, overflow: 'hidden' }}>
                        {m.type === 'video' ? (
                          <video
                            src={m.preview}
                            controls
                            style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }}
                          />
                        ) : (
                          <img
                            src={m.preview}
                            alt="preview"
                            style={{
                              width: '100%', display: 'block', objectFit: 'cover',
                              maxHeight: media.length === 1 ? 340 : 170,
                            }}
                          />
                        )}
                        {/* Remove button */}
                        <button
                          onClick={() => removeMedia(idx)}
                          style={{
                            position: 'absolute', top: 6, right: 6,
                            width: 26, height: 26, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.72)', border: 'none',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <X size={13} />
                        </button>
                        {/* File type badge */}
                        {m.type === 'video' && (
                          <span style={{
                            position: 'absolute', bottom: 6, left: 6,
                            background: 'rgba(0,0,0,0.65)', borderRadius: 6,
                            padding: '2px 7px', fontSize: 11, color: '#fff', fontWeight: 600,
                          }}>VIDEO</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            flexShrink: 0, borderTop: '1px solid var(--border)',
            padding: '10px 16px 12px',
          }}>
            {/* Char progress bar */}
            {content.length > 0 && (
              <div style={{
                height: 2, borderRadius: 2, marginBottom: 10,
                background: 'var(--border)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min((content.length / MAX_CHARS) * 100, 100)}%`,
                  background: overLimit ? '#ef4444' : remaining < 200 ? '#f59e0b' : 'var(--brand)',
                  transition: 'width .1s, background .2s',
                }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Hidden file input */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFiles}
                />

                {/* Image/video button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  title="Add photo or video (max 4)"
                  disabled={media.length >= 4}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: media.length >= 4 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: media.length >= 4 ? 'var(--text-muted)' : 'var(--brand)',
                    transition: 'background .12s',
                    opacity: media.length >= 4 ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => { if (media.length < 4) e.currentTarget.style.background = 'var(--brand-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Image size={19} />
                </button>

                {/* Emoji button + picker */}
                <div style={{ position: 'relative' }} ref={emojiRef}>
                  <button
                    onClick={() => setShowEmoji((v) => !v)}
                    title="Add emoji"
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: 'none',
                      background: showEmoji ? 'var(--brand-light)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: showEmoji ? 'var(--brand)' : 'var(--brand)',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={(e) => { if (!showEmoji) e.currentTarget.style.background = 'var(--brand-light)'; }}
                    onMouseLeave={(e) => { if (!showEmoji) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Smile size={19} />
                  </button>

                  {/* ── Emoji picker panel ─────────────────── */}
                  {showEmoji && (
                    <div style={{
                      position: 'absolute', bottom: 44, left: 0,
                      width: 320, background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                      zIndex: 300, overflow: 'hidden',
                      animation: 'emojiIn .18s cubic-bezier(.16,1,.3,1)',
                    }}>
                      {/* Tabs */}
                      <div style={{
                        display: 'flex', overflowX: 'auto', padding: '8px 10px 0',
                        borderBottom: '1px solid var(--border)', gap: 2,
                      }}>
                        {EMOJI_GROUPS.map((g, i) => (
                          <button
                            key={g.label}
                            onClick={() => setEmojiTab(i)}
                            style={{
                              padding: '5px 10px', borderRadius: '8px 8px 0 0',
                              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                              background: emojiTab === i ? 'var(--bg-tertiary)' : 'transparent',
                              color: emojiTab === i ? 'var(--brand)' : 'var(--text-muted)',
                              borderBottom: emojiTab === i ? '2px solid var(--brand)' : '2px solid transparent',
                              transition: 'all .12s',
                            }}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>

                      {/* Emoji grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                        gap: 2, padding: 10, maxHeight: 200, overflowY: 'auto',
                      }}>
                        {EMOJI_GROUPS[emojiTab].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              insertEmoji(emoji);
                              // Keep picker open so user can add more
                            }}
                            style={{
                              fontSize: 22, border: 'none', background: 'transparent',
                              cursor: 'pointer', borderRadius: 6, padding: 3,
                              lineHeight: 1, transition: 'background .1s, transform .1s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--bg-hover)';
                              e.currentTarget.style.transform = 'scale(1.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Quick close bar */}
                      <div style={{
                        padding: '6px 10px', borderTop: '1px solid var(--border)',
                        display: 'flex', justifyContent: 'flex-end',
                      }}>
                        <button
                          onClick={() => setShowEmoji(false)}
                          style={{
                            fontSize: 12, color: 'var(--text-muted)', fontWeight: 500,
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Close ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Media count badge */}
                {media.length > 0 && (
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: 'var(--text-muted)', padding: '4px 8px',
                  }}>
                    {media.length}/4 files
                  </span>
                )}
              </div>

              {/* Char counter + hint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {remaining <= 500 && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: overLimit ? '#ef4444' : remaining < 100 ? '#f59e0b' : 'var(--text-muted)',
                  }}>
                    {remaining}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {!isEmpty && !overLimit ? '⌘↵ to post' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
