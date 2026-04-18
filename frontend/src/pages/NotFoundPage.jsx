import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'var(--bg-primary)', padding: 24, textAlign: 'center',
    }}>
      <div style={{
        fontSize: 80, fontWeight: 900, letterSpacing: '-4px',
        color: 'var(--brand)', lineHeight: 1, marginBottom: 8,
      }}>
        404
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
        Page not found
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 320 }}>
        This page doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="btn-primary"
        style={{ marginTop: 16, padding: '12px 32px', fontSize: 15, borderRadius: 14 }}
      >
        Back to TeamAGI
      </Link>
    </div>
  );
}
