/**
 * RegisterPage — TeamAGI
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const PWD_RULES = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'Uppercase letter',        test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',        test: (p) => /[a-z]/.test(p) },
  { label: 'Number',                  test: (p) => /\d/.test(p) },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const failed = PWD_RULES.filter((r) => !r.test(form.password));
    if (failed.length) { toast.error('Password does not meet requirements'); return; }
    if (!form.username.trim() || !form.displayName.trim() || !form.email.trim()) {
      toast.error('Please fill in all fields'); return;
    }
    const result = await register({
      username: form.username.trim().toLowerCase(),
      displayName: form.displayName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (result.success) {
      toast.success('Welcome to TeamAGI! 🚀');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        Join TeamAGI
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28 }}>
        Create your account in seconds
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Username + Display Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="jane_doe"
              className="input"
              autoComplete="username"
              pattern="[a-z0-9._]+"
              title="Lowercase letters, numbers, dots, underscores only"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={set('displayName')}
              placeholder="Jane Doe"
              className="input"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="jane@example.com"
            className="input"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: 'var(--text-primary)' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              onFocus={() => setShowRules(true)}
              placeholder="••••••••"
              className="input"
              style={{ paddingRight: 44 }}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center',
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password rules */}
          {showRules && form.password && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: 8 }}>
              {PWD_RULES.map((rule) => {
                const ok = rule.test(form.password);
                return (
                  <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    {ok
                      ? <Check size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                      : <X size={11} style={{ color: '#f87171', flexShrink: 0 }} />
                    }
                    <span style={{ color: ok ? '#22c55e' : 'var(--text-muted)' }}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -2 }}>
          By signing up you agree to our{' '}
          <span style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>Terms</span>{' '}
          and{' '}
          <span style={{ color: 'var(--brand)', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 14 }}
        >
          {isLoading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
            : 'Create account'
          }
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 700, color: 'var(--brand)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
