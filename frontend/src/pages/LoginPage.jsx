/**
 * LoginPage — TeamAGI
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await login(form.identifier.trim(), form.password);
    if (result.success) {
      toast.success('Welcome back! 👋');
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>
        Sign in to your TeamAGI account
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
            Email or Username
          </label>
          <input
            type="text"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
            placeholder="you@example.com"
            className="input"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input"
              style={{ paddingRight: 44 }}
              autoComplete="current-password"
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
          style={{ width: '100%', padding: '12px 16px', fontSize: 15, borderRadius: 14, marginTop: 4 }}
        >
          {isLoading
            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
            : 'Sign in'
          }
        </button>
      </form>

      {/* Demo hint */}
      <div style={{
        marginTop: 20, padding: '12px 14px', borderRadius: 12,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
          Demo credentials
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>

        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
   
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: 'var(--text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ fontWeight: 700, color: 'var(--brand)' }}>
          Sign up free
        </Link>
      </p>
    </div>
  );
}
