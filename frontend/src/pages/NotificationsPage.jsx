/**
 * NotificationsPage — TeamAGI
 * Fixed: proper max-width container, no broken Tailwind padding classes
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationService } from '../services';
import useUIStore from '../store/uiStore';
import Avatar from '../components/shared/Avatar';

const NOTIF_ICONS = {
  like:    { icon: Heart,          color: '#ef4444' },
  comment: { icon: MessageCircle,  color: '#6366f1' },
  follow:  { icon: UserPlus,       color: '#8b5cf6' },
  repost:  { icon: Repeat2,        color: '#10b981' },
  reply:   { icon: MessageCircle,  color: '#6366f1' },
  mention: { icon: Bell,           color: '#f59e0b' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const setUnreadNotifications = useUIStore((s) => s.setUnreadNotifications);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
    select: (r) => r.data,
    onSuccess: (d) => setUnreadNotifications(0),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadNotifications(0);
    },
  });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 0' }} className="animate-fade-in">

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14, padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} style={{ color: 'var(--text-primary)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Notifications
          </h1>
          {data?.unreadCount > 0 && (
            <span className="badge">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>
          )}
        </div>
        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: 'var(--brand)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
            }}
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 0 }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 13, width: '70%', marginBottom: 7, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 11, width: '40%', borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !data?.notifications?.length && (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.15, color: 'var(--text-muted)', display: 'block' }} />
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            No notifications yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            When people interact with you, you'll see it here.
          </p>
        </div>
      )}

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data?.notifications?.map((notif) => {
          const config = NOTIF_ICONS[notif.type] || { icon: Bell, color: 'var(--brand)' };
          const Icon = config.icon;
          const isUnread = !notif.isRead;

          return (
            <div
              key={notif._id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px',
                background: isUnread ? 'var(--brand-light)' : 'var(--card-bg)',
                borderLeft: isUnread ? '3px solid var(--brand)' : '3px solid transparent',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
            >
              {/* Avatar + icon badge */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Link to={`/profile/${notif.sender?.username}`}>
                  <Avatar
                    src={notif.sender?.avatar?.url}
                    name={notif.sender?.displayName || '?'}
                    size={44}
                  />
                </Link>
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 20, height: 20, borderRadius: '50%',
                  background: config.color,
                  border: '2px solid var(--card-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={10} style={{ color: '#fff' }} />
                </div>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <Link
                    to={`/profile/${notif.sender?.username}`}
                    style={{ fontWeight: 700, color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {notif.sender?.displayName}
                  </Link>
                  {' '}{notif.text}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Post thumbnail */}
              {notif.post?.media?.[0] && (
                <img
                  src={notif.post.media[0].url}
                  alt=""
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
