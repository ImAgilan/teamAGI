/**
 * AuthLayout — TeamAGI Split-Screen Auth Wrapper
 */
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-primary)' }}>

      {/* Left branding panel — hidden on mobile */}
      <div
        style={{
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: 480,
          flexShrink: 0,
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #3730a3 0%, #6366f1 45%, #8b5cf6 80%, #a78bfa 100%)',
        }}
        className="lg:flex"
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: 80, left: -80,
          width: 220, height: 220, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: 40,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>Ꞇ∂</span>
            </div>
            <span style={{ color: '#fff', fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px' }}>
              TeamAGI
            </span>
          </div>

          <h1 style={{
            color: '#fff', fontSize: 42, fontWeight: 800,
            lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px',
          }}>
            Build the future together.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 17, lineHeight: 1.65 }}>
            Connect with AI researchers, builders, and thinkers shaping the next era of intelligence.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { emoji: '⚡', text: 'Real-time feeds with AI-curated content' },
            { emoji: '💬', text: 'Instant messaging & live collaboration' },
            { emoji: '🔭', text: 'Explore trending ideas & breakthroughs' },
          ].map(({ emoji, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: 15 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '32px 24px',
        overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--brand) 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>T</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>TeamAGI</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
