/**
 * MobileNav — TeamAGI Bottom Tab Bar (mobile only)
 */
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, Bell, MessageCircle } from 'lucide-react';
import useUIStore from '../../store/uiStore';

export default function MobileNav() {
  const { openCreatePost, unreadNotifications, unreadMessages } = useUIStore();

  return (
    <nav style={{
      display: 'flex',
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 60,
      background: 'var(--card-bg)',
      borderTop: '1px solid var(--border)',
      zIndex: 50,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}
      className="md:hidden"
    >
      {[
        { to: '/', icon: Home, exact: true },
        { to: '/explore', icon: Compass },
      ].map(({ to, icon: Icon, exact }) => (
        <NavLink key={to} to={to} end={exact} style={{ padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {({ isActive }) => (
            <Icon size={24} strokeWidth={1.8} style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }} />
          )}
        </NavLink>
      ))}

      {/* Center create button */}
      <button
        onClick={openCreatePost}
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(var(--brand-rgb),0.4)',
        }}
      >
        <PlusCircle size={22} style={{ color: '#fff' }} />
      </button>

      {[
        { to: '/notifications', icon: Bell,          badge: unreadNotifications },
        { to: '/messages',      icon: MessageCircle, badge: unreadMessages      },
      ].map(({ to, icon: Icon, badge }) => (
        <NavLink key={to} to={to} style={{ padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {({ isActive }) => (
            <>
              <Icon size={24} strokeWidth={1.8} style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }} />
              {badge > 0 && (
                <span className="badge" style={{ position: 'absolute', top: 4, right: 4, fontSize: 9, minWidth: 15, height: 15 }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
