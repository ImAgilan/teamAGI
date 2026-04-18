/**
 * CreatePostBar — TeamAGI quick compose bar
 */
import { PlusCircle } from 'lucide-react';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import Avatar from '../shared/Avatar';

export default function CreatePostBar() {
  const openCreatePost = useUIStore((s) => s.openCreatePost);
  const user = useAuthStore((s) => s.user);

  return (
    <div
      className="card"
      onClick={openCreatePost}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '62px 16px', marginBottom: 8, cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      <Avatar src={user?.avatar?.url} name={user?.displayName || 'U'} size={38} />
      <div
        style={{
          flex: 1, padding: '8px 14px', borderRadius: 12,
          background: 'var(--bg-tertiary)', fontSize: 14,
          color: 'var(--text-muted)', userSelect: 'none',
          border: '1px solid var(--border)',
        }}
      >
        What's on your mind, {user?.displayName?.split(' ')[0] || 'there'}?
      </div>
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--brand)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <PlusCircle size={18} style={{ color: '#fff' }} />
      </div>
    </div>
  );
}
