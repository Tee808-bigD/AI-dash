import { Fragment } from 'react';

interface LoadingSkeletonProps {
  /** Visual variant */
  variant: 'card' | 'stat-card' | 'text' | 'avatar' | 'panel' | 'chip' | 'chart-bar' | 'agent-card' | 'compact-agent';
  /** Number of skeleton items to repeat (default 1) */
  count?: number;
  /** Optional custom width (e.g. '60%', '200px') */
  width?: string;
  /** Optional custom height */
  height?: string;
  /** Optional extra class name */
  className?: string;
}

function SkeletonBlock({ width, height, className }: { width?: string; height?: string; className?: string }) {
  return (
    <div
      className={`skeleton ${className || ''}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    />
  );
}

export default function LoadingSkeleton({
  variant,
  count = 1,
  width,
  height,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  const renderSkeleton = (_: unknown, i: number) => {
    switch (variant) {
      /* ──────────────────────────────────────────
         Card — generic rectangular card placeholder
         ────────────────────────────────────────── */
      case 'card':
        return (
          <div
            key={i}
            className={`panel skeleton-card ${className || ''}`}
            style={{
              padding: '1.5rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'center' }}>
              <SkeletonBlock width="44px" height="44px" className="skeleton-avatar" />
              <div style={{ flex: 1 }}>
                <SkeletonBlock width="60%" height="1rem" />
                <div style={{ marginTop: '0.4rem' }}>
                  <SkeletonBlock width="40%" height="0.75rem" />
                </div>
              </div>
            </div>
            <SkeletonBlock width="100%" height="0.75rem" />
            <div style={{ marginTop: '0.4rem' }}>
              <SkeletonBlock width="85%" height="0.75rem" />
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <SkeletonBlock width="80px" height="2rem" />
              <SkeletonBlock width="80px" height="2rem" />
            </div>
          </div>
        );

      /* ──────────────────────────────────────────
         Stat card — mimics the stats-card layout
         ────────────────────────────────────────── */
      case 'stat-card':
        return (
          <div
            key={i}
            className="stats-card"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="stats-card-header">
              <SkeletonBlock width="44px" height="44px" className="skeleton-icon" />
              <SkeletonBlock width="50px" height="1.2rem" />
            </div>
            <div className="stats-value" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <SkeletonBlock width="70%" height="2rem" />
              <SkeletonBlock width="50%" height="0.8rem" />
            </div>
          </div>
        );

      /* ──────────────────────────────────────────
         Panel — dashboard panel placeholder
         ────────────────────────────────────────── */
      case 'panel':
        return (
          <div
            key={i}
            className="panel"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
              <SkeletonBlock width="18px" height="18px" />
              <SkeletonBlock width="120px" height="1.2rem" />
            </div>
            <SkeletonBlock width="100%" height="0.85rem" />
            <div style={{ marginTop: '0.3rem' }}>
              <SkeletonBlock width="70%" height="0.85rem" />
            </div>
            <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <SkeletonBlock width="40px" height="40px" className="skeleton-avatar" />
                  <div style={{ flex: 1 }}>
                    <SkeletonBlock width="50%" height="0.9rem" />
                    <div style={{ marginTop: '0.2rem' }}>
                      <SkeletonBlock width="35%" height="0.75rem" />
                    </div>
                  </div>
                  <SkeletonBlock width="10px" height="10px" />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <SkeletonBlock width="100%" height="2.2rem" />
            </div>
          </div>
        );

      /* ──────────────────────────────────────────
         Agent card — mimics the agent-card layout
         ────────────────────────────────────────── */
      case 'agent-card':
        return (
          <div
            key={i}
            className="agent-card"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="agent-card-header">
              <SkeletonBlock width="56px" height="56px" className="skeleton-avatar" />
              <SkeletonBlock width="12px" height="12px" />
            </div>
            <SkeletonBlock width="65%" height="1.3rem" />
            <div style={{ marginTop: '0.4rem' }}>
              <SkeletonBlock width="100px" height="1.4rem" />
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <SkeletonBlock width="100%" height="0.85rem" />
              <div style={{ marginTop: '0.25rem' }}>
                <SkeletonBlock width="80%" height="0.85rem" />
              </div>
            </div>
            <div className="agent-meta" style={{ marginTop: '1rem' }}>
              <SkeletonBlock width="80px" height="0.85rem" />
              <SkeletonBlock width="100px" height="0.85rem" />
            </div>
            <div className="agent-card-footer">
              <SkeletonBlock width="90px" height="2rem" />
              <SkeletonBlock width="90px" height="2rem" />
            </div>
          </div>
        );

      /* ──────────────────────────────────────────
         Compact agent — for the Active Agents panel
         ────────────────────────────────────────── */
      case 'compact-agent':
        return (
          <div
            key={i}
            className="compact-agent"
            style={{ cursor: 'default', padding: '0.7rem' }}
          >
            <SkeletonBlock width="40px" height="40px" className="skeleton-avatar" />
            <div className="compact-agent-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <SkeletonBlock width="140px" height="0.9rem" />
              <SkeletonBlock width="90px" height="0.75rem" />
            </div>
            <SkeletonBlock width="10px" height="10px" />
          </div>
        );

      /* ──────────────────────────────────────────
         Text lines — paragraph placeholder
         ────────────────────────────────────────── */
      case 'text':
        return (
          <div key={i} className={className} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <SkeletonBlock width={width || '100%'} height={height || '0.85rem'} />
            <SkeletonBlock width="95%" height={height || '0.85rem'} />
            <SkeletonBlock width="85%" height={height || '0.85rem'} />
            <SkeletonBlock width="70%" height={height || '0.85rem'} />
          </div>
        );

      /* ──────────────────────────────────────────
         Avatar — circular skeleton
         ────────────────────────────────────────── */
      case 'avatar':
        return (
          <div
            key={i}
            className={`skeleton ${className || ''}`}
            style={{
              width: width || '56px',
              height: height || '56px',
              borderRadius: '50%',
              display: 'inline-block',
            }}
          />
        );

      /* ──────────────────────────────────────────
         Chip — small label / filter chip placeholder
         ────────────────────────────────────────── */
      case 'chip':
        return (
          <SkeletonBlock
            key={i}
            width={width || '100px'}
            height={height || '1.8rem'}
            className={className}
          />
        );

      /* ──────────────────────────────────────────
         Chart bar — vertical bar placeholder
         ────────────────────────────────────────── */
      case 'chart-bar':
        return (
          <div
            key={i}
            className={`skeleton ${className || ''}`}
            style={{
              width: width || '100%',
              height: height || `${40 + Math.random() * 60}px`,
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            }}
          />
        );

      default:
        return <SkeletonBlock key={i} width={width} height={height} className={className} />;
    }
  };

  if (count === 1) return <>{renderSkeleton(undefined, 0)}</>;

  return (
    <Fragment>
      {items.map((_, i) => renderSkeleton(undefined, i))}
    </Fragment>
  );
}
