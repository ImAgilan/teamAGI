/**
 * Sidebar — TeamAGI Desktop Navigation
 */
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Compass, Bell, MessageCircle, Bookmark,
  Settings, PlusCircle, LogOut, Sun, Moon, Monitor, ShieldCheck,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import Avatar from './Avatar';

const NAV_LINKS = [
  { to: '/',             icon: Home,          label: 'Home',         exact: true },
  { to: '/explore',      icon: Compass,       label: 'Explore'              },
  { to: '/notifications',icon: Bell,          label: 'Notifications'        },

  { to: '/messages',     icon: MessageCircle, label: 'Messages'             },
  { to: '/bookmarks',    icon: Bookmark,      label: 'Bookmarks'            },
  { to: '/settings',     icon: Settings,      label: 'Settings'             },
];

const THEMES = [
  { value: 'light', icon: Sun,     label: 'Light'  },
  { value: 'dark',  icon: Moon,    label: 'Dark'   },
  { value: 'system',icon: Monitor, label: 'System' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, unreadNotifications, unreadMessages, openCreatePost } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    /* .sidebar class from CSS: hidden on mobile, fixed flex-col on md+ */
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: '50px 4px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17 }}>Ꞇ∂</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.2px', lineHeight: 1.2 }}>
              TeamAGI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Social Platform</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
  {NAV_LINKS.map(({ to, icon: Icon, label, exact }) => (
    <NavLink
      key={to}
      to={to}
      end={exact}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={20} strokeWidth={1.75} />
        {label === 'Notifications' && unreadNotifications > 0 && (
          <span className="badge" style={{ position: 'absolute', top: -7, right: -9, fontSize: 9, minWidth: 16, height: 16 }}>
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
        {label === 'Messages' && unreadMessages > 0 && (
          <span className="badge" style={{ position: 'absolute', top: -7, right: -9, fontSize: 9, minWidth: 16, height: 16 }}>
            {unreadMessages > 9 ? '9+' : unreadMessages}
          </span>
        )}
      </div>
      <span>{label}</span>
    </NavLink>
  ))}

  {/* ✅ ADD PROFILE HERE */}
  {user && (
    <NavLink
      to={`/profile/${user.username}`}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <Avatar
        src={user?.avatar?.url}
        name={user?.displayName}
        size={20}
      />
      <span>Profile</span>
    </NavLink>
  )}

  {/* Admin */}
  {user?.role === 'admin' && (
    <NavLink
      to="/admin"
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      <ShieldCheck size={20} strokeWidth={1.75} />
      <span>Admin</span>
    </NavLink>
  )}
</nav>

      {/* Create Post button */}
      <button
        onClick={openCreatePost}
        className="btn-primary"
        style={{ width: '100%', marginBottom: 10, justifyContent: 'center' }}
      >
        <PlusCircle size={16} />
        New Post
      </button>

      {/* Theme switcher */}
      <div style={{
        display: 'flex', gap: 3, padding: 3, borderRadius: 11,
        background: 'var(--bg-tertiary)', marginBottom: 10,
      }}>
        {THEMES.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: theme === value ? 'var(--bg-secondary)' : 'transparent',
              color: theme === value ? 'var(--brand)' : 'var(--text-muted)',
              boxShadow: theme === value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* User profile row */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <NavLink
          to={`/profile/${user?.username}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}
        >
          <Avatar src={user?.avatar?.url} name={user?.displayName || 'U'} size={34} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.displayName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              @{user?.username}
            </p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="btn-ghost"
          title="Sign out"
          style={{ padding: 7, color: '#ef4444', flexShrink: 0 }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
