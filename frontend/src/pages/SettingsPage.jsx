/**
 * SettingsPage — TeamAGI
 * Fixed: proper max-width container, no broken Tailwind classes
 */
import { useState } from 'react';
import { Sun, Moon, Monitor, Lock, LogOut, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';

const THEMES = [
  { value: 'light',  label: 'Light',  icon: Sun     },
  { value: 'dark',   label: 'Dark',   icon: Moon    },
  { value: 'system', label: 'System', icon: Monitor },
];

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: '20px 20px', marginBottom: 12 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const pwMutation = useMutation({
    mutationFn: () => userService.changePassword({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed! Please sign in again.');
      logout();
      navigate('/login');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to change password'),
  });

  const handlePwSubmit = (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('Fill in all fields'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    pwMutation.mutate();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const PwField = ({ label, field, placeholder }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPw[field] ? 'text' : 'password'}
          value={pwForm[field]}
          onChange={(e) => setPwForm((f) => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder || '••••••••'}
          className="input"
          style={{ paddingRight: 44 }}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}
          style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}
        >
          {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 0' }} className="animate-fade-in">

      {/* Page title */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <div style={{ padding: '0 0 80px' }}>
        {/* Appearance */}
        <Section title="Appearance">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Choose your preferred color theme
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {THEMES.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '14px 8px', borderRadius: 14,
                    border: active ? '2px solid var(--brand)' : '1px solid var(--border)',
                    background: active ? 'var(--brand-light)' : 'var(--bg-tertiary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={22} style={{ color: active ? 'var(--brand)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--brand)' : 'var(--text-secondary)' }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Change password */}
        <Section title="Change Password">
          <form onSubmit={handlePwSubmit}>
            <PwField label="Current Password" field="current" />
            <PwField label="New Password" field="new" />
            <PwField label="Confirm New Password" field="confirm" />
            <button
              type="submit"
              disabled={pwMutation.isPending}
              className="btn-primary"
              style={{ marginTop: 4 }}
            >
              {pwMutation.isPending
                ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…</>
                : <><Lock size={14} /> Update Password</>
              }
            </button>
          </form>
        </Section>

        {/* Account */}
        <Section title="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, color: '#f59e0b', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={17} />
              Sign out
            </button>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, color: '#ef4444', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Trash2 size={17} />
              Delete account
            </button>
          </div>
        </Section>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
