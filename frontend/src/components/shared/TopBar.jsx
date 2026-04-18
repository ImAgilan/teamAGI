/**
 * TopBar — TeamAGI Mobile Top Navigation Bar
 *
 * Shown on mobile (< 768px), hidden on desktop where the sidebar takes over.
 * Contains:
 *   Left  — Hamburger menu button (opens full-screen drawer)
 *   Center — TeamAGI logo
 *   Right  — Notification bell + Avatar (links to profile)
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu, X, Home, Compass, Bell, MessageCircle,
  Bookmark, Settings, ShieldCheck, PlusCircle,
  LogOut, Sun, Moon, Monitor, User,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import Avatar from './Avatar';

const NAV_LINKS = [
  { to: '/',              icon: Home,          label: 'Home',          exact: true  },
  { to: '/explore',       icon: Compass,       label: 'Explore',       exact: false },
  { to: '/notifications', icon: Bell,          label: 'Notifications', exact: false },
  { to: '/messages',      icon: MessageCircle, label: 'Messages',      exact: false },
  { to: '/bookmarks',     icon: Bookmark,      label: 'Bookmarks',     exact: false },
  { to: '/settings',      icon: Settings,      label: 'Settings',      exact: false },
];

const THEMES = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout }        = useAuthStore();
  const {
    theme, setTheme,
    unreadNotifications, unreadMessages,
    openCreatePost,
  } = useUIStore();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  const handleNewPost = () => {
    closeMenu();
    openCreatePost();
  };

  return (
    <>
      {/* ── Top bar strip ─────────────────────────────────── */}
      <header style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        // Only show on mobile — hidden on md+ via CSS
      }} className="mobile-topbar">

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: 'none', background: menuOpen ? 'var(--brand-light)' : 'var(--bg-tertiary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: menuOpen ? 'var(--brand)' : 'var(--text-secondary)',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          aria-label="Open menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo — center */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>Ꞇ∂</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
            TeamAGI
          </span>
        </NavLink>

        {/* Right: bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Notification bell */}
          <NavLink
            to="/notifications"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 6 }}
          >
            <Bell size={22} strokeWidth={1.8} style={{ color: 'var(--text-secondary)' }} />
            {unreadNotifications > 0 && (
              <span className="badge" style={{
                position: 'absolute', top: 2, right: 2,
                fontSize: 9, minWidth: 15, height: 15,
              }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </NavLink>

          {/* Avatar → profile */}
          <NavLink to={`/profile/${user?.username}`} style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar src={user?.avatar?.url} name={user?.displayName || 'U'} size={32} />
          </NavLink>
        </div>
      </header>

      {/* ── Slide-down menu drawer ────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed', inset: 0, zIndex: 48,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer panel */}
          <div
            style={{
              position: 'fixed',
              top: 56, left: 0, right: 0,
              zIndex: 49,
              background: 'var(--card-bg)',
              borderBottom: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              animation: 'menuSlideDown 0.22s cubic-bezier(0.16,1,0.3,1)',
              maxHeight: 'calc(100vh - 56px)',
              overflowY: 'auto',
            }}
          >
            <style>{`
              @keyframes menuSlideDown {
                from { opacity: 0; transform: translateY(-12px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* User profile row at top of menu */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px 16px 12px',
              borderBottom: '1px solid var(--border)',
            }}>
              <Avatar src={user?.avatar?.url} name={user?.displayName || 'U'} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.displayName}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{user?.username}
                </p>
              </div>
              {/* View profile */}
              <NavLink
                to={`/profile/${user?.username}`}
                onClick={closeMenu}
                style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                  padding: '5px 12px', borderRadius: 20,
                  border: '1.5px solid var(--brand)',
                  background: 'var(--brand-light)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                My Profile
              </NavLink>
            </div>

            {/* Nav links */}
            <div style={{ padding: '8px 10px' }}>
              {NAV_LINKS.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={closeMenu}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 12px', borderRadius: 12,
                    fontSize: 15, fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--brand)' : 'var(--text-primary)',
                    background: isActive ? 'var(--brand-light)' : 'transparent',
                    textDecoration: 'none', marginBottom: 2,
                    transition: 'background 0.12s',
                  })}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon size={21} strokeWidth={1.75} />
                    {label === 'Notifications' && unreadNotifications > 0 && (
                      <span className="badge" style={{ position: 'absolute', top: -6, right: -8, fontSize: 9, minWidth: 16, height: 16 }}>
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                    {label === 'Messages' && unreadMessages > 0 && (
                      <span className="badge" style={{ position: 'absolute', top: -6, right: -8, fontSize: 9, minWidth: 16, height: 16 }}>
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </div>
                  {label}
                </NavLink>
              ))}

              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 12px', borderRadius: 12,
                    fontSize: 15, fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--brand)' : 'var(--text-primary)',
                    background: isActive ? 'var(--brand-light)' : 'transparent',
                    textDecoration: 'none', marginBottom: 2,
                  })}
                >
                  <ShieldCheck size={21} strokeWidth={1.75} />
                  Admin
                </NavLink>
              )}
            </div>

            {/* New post button */}
            <div style={{ padding: '4px 20px 12px' }}>
              <button
                onClick={handleNewPost}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                  background: 'var(--brand)', color: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                <PlusCircle size={18} />
                New Post
              </button>
            </div>

            {/* Theme + logout */}
            <div style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              {/* Theme switcher */}
              <div style={{
                display: 'flex', gap: 3, padding: 3,
                borderRadius: 10, background: 'var(--bg-tertiary)', flex: 1,
              }}>
                {THEMES.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    title={label}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: theme === value ? 'var(--bg-secondary)' : 'transparent',
                      color: theme === value ? 'var(--brand)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 10,
                  border: 'none', background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
