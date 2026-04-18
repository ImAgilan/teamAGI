/**
 * EditProfileModal — TeamAGI
 *
 * Root cause of avatar/cover not showing after upload:
 *   The modal received `profile` as a prop at open-time.
 *   After upload, queryClient.invalidateQueries(['profile', username]) fires,
 *   React Query refetches, but the MODAL still holds the OLD prop value.
 *   The ProfilePage re-renders with new data but the modal's local state
 *   (avatarPreview / coverPreview) initialized from the stale prop stays stale.
 *
 * Fix:
 *   1. Use local blob URL for INSTANT preview as soon as file is selected
 *   2. After successful upload, store the real Cloudinary URL in local state
 *   3. Force the authStore AND query cache to update so Sidebar/ProfilePage reflect change
 *   4. The modal closes after Save, so the ProfilePage re-renders with fresh query data
 */
import { useState, useRef } from 'react';
import { X, Camera, Loader2, Save, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '../../services';
import useAuthStore from '../../store/authStore';
import Avatar from '../shared/Avatar';

export default function EditProfileModal({ profile, onClose }) {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const avatarFileRef = useRef(null);
  const coverFileRef = useRef(null);

  // Track the LIVE url — starts from profile prop, updates after upload
  const [liveAvatarUrl, setLiveAvatarUrl] = useState(profile.avatar?.url || null);
  const [liveCoverUrl, setLiveCoverUrl] = useState(profile.coverImage?.url || null);

  const [form, setForm] = useState({
    displayName: profile.displayName || '',
    bio:         profile.bio         || '',
    website:     profile.website     || '',
    location:    profile.location    || '',
  });

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  // ── Save profile fields ───────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => userService.updateProfile(form),
    onSuccess: (res) => {
      updateUser(res.data.user);
      // Force both the profile query and any dependent queries to refetch
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username], refetchType: 'all' });
      toast.success('Profile saved!');
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Save failed'),
  });

  // ── Upload avatar ─────────────────────────────────────────
  const avatarMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);   // must match: uploadAvatar.single('avatar')
      return userService.uploadAvatar(fd);
    },
    onSuccess: (res) => {
      const url = res.data.avatar?.url;
      if (url) {
        setLiveAvatarUrl(url);
        // Update auth store so Sidebar shows new avatar immediately
        updateUser({ avatar: res.data.avatar });
      }
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username], refetchType: 'all' });
      toast.success('Photo updated!');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Upload failed';
      toast.error(`${msg} (max 5MB, jpg/png/webp)`);
      // Revert preview to original
      setLiveAvatarUrl(profile.avatar?.url || null);
    },
  });

  // ── Upload cover ──────────────────────────────────────────
  const coverMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('cover', file);    // must match: uploadCover.single('cover')
      return userService.uploadCover(fd);
    },
    onSuccess: (res) => {
      const url = res.data.coverImage?.url;
      if (url) setLiveCoverUrl(url);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username], refetchType: 'all' });
      toast.success('Cover updated!');
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Upload failed';
      toast.error(`${msg} (max 10MB)`);
      setLiveCoverUrl(profile.coverImage?.url || null);
    },
  });

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    // Show instant blob preview
    setLiveAvatarUrl(URL.createObjectURL(file));
    avatarMutation.mutate(file);
    e.target.value = '';
  };

  const handleCoverPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Cover must be under 10MB'); return; }
    setLiveCoverUrl(URL.createObjectURL(file));
    coverMutation.mutate(file);
    e.target.value = '';
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.62)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(.95) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500,
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 20,
          maxHeight: '92vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn .22s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10,
          borderRadius: '20px 20px 0 0',
        }}>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Edit Profile
          </span>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.displayName.trim()}
            style={{
              padding: '7px 20px', borderRadius: 20, border: 'none',
              background: saveMutation.isPending || !form.displayName.trim()
                ? 'var(--bg-tertiary)' : 'var(--brand)',
              color: saveMutation.isPending || !form.displayName.trim()
                ? 'var(--text-muted)' : '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
            }}
          >
            {saveMutation.isPending
              ? <><Loader2 size={14} style={{ animation: 'spin .8s linear infinite' }} /> Saving…</>
              : <><Save size={13} /> Save</>
            }
          </button>
        </div>

        {/* ── Cover image ─────────────────────────────── */}
        <div
          onClick={() => coverFileRef.current?.click()}
          style={{
            height: 130, position: 'relative', cursor: 'pointer',
            background: liveCoverUrl
              ? undefined
              : 'linear-gradient(135deg, #3730a3 0%, #6366f1 60%, #8b5cf6 100%)',
            overflow: 'hidden',
          }}
        >
          {liveCoverUrl && (
            <img src={liveCoverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.32)', transition: 'background .15s',
          }}>
            {coverMutation.isPending
              ? <Loader2 size={26} style={{ color: '#fff', animation: 'spin .8s linear infinite' }} />
              : <Camera size={26} style={{ color: '#fff' }} />
            }
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleCoverPick}
          />
        </div>

        {/* ── Avatar ─────────────────────────────────── */}
        <div style={{ padding: '0 20px', marginTop: -42, marginBottom: 12, position: 'relative', zIndex: 2 }}>
          <div
            onClick={() => avatarFileRef.current?.click()}
            style={{
              position: 'relative', display: 'inline-block',
              cursor: 'pointer', borderRadius: '50%',
            }}
          >
            <div style={{ border: '4px solid var(--card-bg)', borderRadius: '50%', overflow: 'hidden', lineHeight: 0 }}>
              <Avatar src={liveAvatarUrl} name={profile.displayName} size={80} />
            </div>
            {/* Camera overlay */}
            <div style={{
              position: 'absolute', inset: 4, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.38)',
            }}>
              {avatarMutation.isPending
                ? <Loader2 size={18} style={{ color: '#fff', animation: 'spin .8s linear infinite' }} />
                : <Camera size={18} style={{ color: '#fff' }} />
              }
            </div>
            {/* Success tick */}
            {!avatarMutation.isPending && liveAvatarUrl && liveAvatarUrl !== (profile.avatar?.url || null) && (
              <div style={{
                position: 'absolute', bottom: 4, right: 0,
                width: 20, height: 20, borderRadius: '50%',
                background: '#10b981', border: '2px solid var(--card-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={12} style={{ color: '#fff' }} />
              </div>
            )}
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleAvatarPick}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Tap photo or banner to change
          </p>
        </div>

        {/* ── Form ───────────────────────────────────── */}
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Display Name', field: 'displayName', max: 50, required: true },
            { label: 'Bio', field: 'bio', max: 160, multiline: true },
            { label: 'Website', field: 'website', max: 100, placeholder: 'https://yoursite.com', type: 'url' },
            { label: 'Location', field: 'location', max: 50, placeholder: 'City, Country' },
          ].map(({ label, field, max, required, multiline, placeholder, type }) => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
                {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              {multiline ? (
                <textarea
                  value={form[field]}
                  onChange={set(field)}
                  maxLength={max}
                  rows={3}
                  placeholder={placeholder || `Your ${label.toLowerCase()}…`}
                  className="input"
                  style={{ resize: 'vertical', minHeight: 70 }}
                />
              ) : (
                <input
                  type={type || 'text'}
                  value={form[field]}
                  onChange={set(field)}
                  maxLength={max}
                  placeholder={placeholder || `Your ${label.toLowerCase()}…`}
                  className="input"
                />
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>
                {form[field]?.length || 0}/{max}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
