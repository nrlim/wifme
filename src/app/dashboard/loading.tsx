export default function DashboardLoading() {
  return (
    <div style={{ background: "var(--ivory)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header Skeleton */}
      <div style={{
        height: '72px',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.5rem',
        gap: '1rem'
      }}>
        <div style={{ height: 28, width: 140, background: 'var(--ivory-dark)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ height: 36, width: 36, background: 'var(--ivory-dark)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
      </div>

      <main style={{ flex: 1, padding: "clamp(1rem, 3vw, 1.75rem) clamp(1rem, 4vw, 2rem)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Title Skeleton */}
        <div style={{ height: 32, width: 220, background: 'var(--ivory-dark)', borderRadius: 8, marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }} />

        {/* Hero Card Skeleton */}
        <div style={{ height: 180, width: '100%', background: 'var(--emerald-glow)', borderRadius: 24, animation: 'pulse 1.5s infinite' }} />

        {/* Action/Filter Skeleton */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ height: 44, width: 120, background: 'var(--ivory-dark)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 44, width: 120, background: 'var(--ivory-dark)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: 44, width: 120, background: 'var(--ivory-dark)', borderRadius: 12, animation: 'pulse 1.5s infinite' }} />
        </div>

        {/* Content Area Skeleton */}
        <div style={{ height: 300, width: '100%', background: 'white', borderRadius: 20, border: '1px solid var(--border)', marginTop: '0.5rem', animation: 'pulse 1.5s infinite' }}>
          {/* Internal rows */}
          <div style={{ height: 60, width: '100%', borderBottom: '1px solid var(--border)' }} />
          <div style={{ height: 60, width: '100%', borderBottom: '1px solid var(--border)' }} />
          <div style={{ height: 60, width: '100%' }} />
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
